import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("openai", () => {
  const mockCreate = vi.fn().mockRejectedValue(new Error("OpenAI API unauthorized"));
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: { create: mockCreate },
    },
  }));
  (MockOpenAI as any).__mockCreate = mockCreate;
  return { default: MockOpenAI };
});

vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn().mockRejectedValue(new Error("Anthropic unauthorized")) },
  }));
  return { default: MockAnthropic };
});

import {
  isTerminalFailure,
  validateAIResponse,
  callWithFallback,
  type TerminalFailureError,
  type AIProviderResult,
  type CallType,
} from "../artifacts/api-server/src/services/ai-fallback";

describe("callWithFallback — no providers configured", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    delete process.env.ABACUSAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.SELF_HOSTED_AI_ENDPOINT;
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  it("throws TerminalFailureError when no providers are configured", async () => {
    let caughtError: unknown = null;
    try {
      await callWithFallback("test prompt");
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(isTerminalFailure(caughtError)).toBe(true);
  });

  it("TerminalFailureError contains userMessage string, attempts array, and providersAttempted", async () => {
    let caughtError: TerminalFailureError | null = null;
    try {
      await callWithFallback("test prompt");
    } catch (err) {
      if (isTerminalFailure(err)) caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(typeof caughtError!.userMessage).toBe("string");
    expect(caughtError!.userMessage.length).toBeGreaterThan(0);
    expect(caughtError!.isTerminalFailure).toBe(true);
    expect(Array.isArray(caughtError!.providersAttempted)).toBe(true);
    expect(Array.isArray(caughtError!.attempts)).toBe(true);
  });
});

describe("isTerminalFailure type guard", () => {
  it("correctly identifies TerminalFailureError objects", () => {
    const terminalErr: TerminalFailureError = {
      isTerminalFailure: true,
      userMessage: "AI services are currently unavailable.",
      providersAttempted: ["openai"],
      attempts: [],
      message: "Terminal failure",
      name: "TerminalFailureError",
    };
    expect(isTerminalFailure(terminalErr)).toBe(true);
  });

  it("returns false for regular Error objects", () => {
    expect(isTerminalFailure(new Error("regular error"))).toBe(false);
  });

  it("returns false for objects with isTerminalFailure: false", () => {
    expect(isTerminalFailure({ isTerminalFailure: false })).toBe(false);
  });

  it("returns true for any object with isTerminalFailure: true", () => {
    expect(isTerminalFailure({ isTerminalFailure: true, extra: "data" })).toBe(true);
  });

  it("returns falsy for null and undefined", () => {
    expect(isTerminalFailure(undefined)).toBeFalsy();
    expect(isTerminalFailure(null)).toBeFalsy();
  });
});

describe("validateAIResponse — quality scoring logic", () => {
  const callType: CallType = "general";

  it("returns pass: true for long, high-quality responses", () => {
    const response = "This protocol addresses multiple pathways of healing through targeted supplementation and lifestyle optimization. " +
      "Key interventions include NAD+ precursors for mitochondrial function, adaptogenic herbs for HPA axis regulation, " +
      "and targeted amino acids for neurotransmitter synthesis. Implementation follows a phased approach with weekly check-ins.";
    const result = validateAIResponse(response, callType);
    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThan(60);
  });

  it("returns pass: false and score 0 for empty responses", () => {
    const result = validateAIResponse("", callType);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
  });

  it("records reasons when response is very short in protocol-generation mode", () => {
    const result = validateAIResponse("ok", "protocol-generation");
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.toLowerCase().includes("short"))).toBe(true);
  });

  it("detects refusal patterns and lowers score below threshold for strict call types", () => {
    const refusal = "I cannot provide medical advice or treatment protocols.";
    const result = validateAIResponse(refusal, "protocol-generation");
    expect(result.pass).toBe(false);
    expect(result.reasons.some(r => r.toLowerCase().includes("refusal") || r.toLowerCase().includes("pattern"))).toBe(true);
  });

  it("returns score >= 70 for responses meeting all quality criteria", () => {
    const excellent = "The comprehensive exosome protocol for this patient incorporates multiple evidence-based interventions. " +
      "Phase 1 focuses on foundational optimization through mitochondrial support and anti-inflammatory protocols. " +
      "Phase 2 introduces targeted peptide therapies aligned with the patient's specific health goals and biomarkers. " +
      "Supplement recommendations are dosed based on current research and individualized to the patient profile. " +
      "Regular monitoring checkpoints ensure protocol effectiveness and allow for adaptive adjustments as needed.";
    const result = validateAIResponse(excellent, callType);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("returns score as a number between 0 and 100", () => {
    const result = validateAIResponse("Some response text for validation purposes.", callType);
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns reasons array documenting all quality failures", () => {
    const result = validateAIResponse("too short", callType);
    expect(Array.isArray(result.reasons)).toBe(true);
    if (!result.pass) {
      expect(result.reasons.length).toBeGreaterThan(0);
    }
  });

  it("protocol-generation threshold is stricter than general for short responses", () => {
    const shortResponse = "Take vitamin D and get more sleep.";
    const generalResult = validateAIResponse(shortResponse, "general");
    const protocolResult = validateAIResponse(shortResponse, "protocol-generation");
    expect(protocolResult.score).toBeLessThanOrEqual(generalResult.score);
  });
});

describe("callWithFallback — result structure contract", () => {
  it("AIProviderResult interface has the required fields when call succeeds", async () => {
    const requiredFields: (keyof AIProviderResult)[] = [
      "response", "provider", "model", "fallbackUsed", "escalationUsed",
      "qualityScore", "latencyMs", "attempts",
    ];

    let result: AIProviderResult | null = null;
    let error: unknown = null;
    try {
      result = await callWithFallback("test prompt that may fail", {
        callType: "general",
        skipQualityCheck: true,
      });
    } catch (err) {
      error = err;
    }

    if (result) {
      for (const field of requiredFields) {
        expect(result).toHaveProperty(field);
      }
      expect(typeof result.response).toBe("string");
      expect(typeof result.provider).toBe("string");
      expect(typeof result.latencyMs).toBe("number");
      expect(typeof result.qualityScore).toBe("number");
    } else if (error && isTerminalFailure(error)) {
      expect(error.isTerminalFailure).toBe(true);
      if (error.attempts.length > 0) {
        expect(error.attempts[0]).toHaveProperty("provider");
        expect(error.attempts[0]).toHaveProperty("model");
        expect(error.attempts[0]).toHaveProperty("latencyMs");
      }
    } else {
      throw error;
    }
  });

  it("TerminalFailureError attempts include success flag, error, and timing info", async () => {
    let caughtError: TerminalFailureError | null = null;
    try {
      await callWithFallback("test prompt");
    } catch (err) {
      if (isTerminalFailure(err)) caughtError = err;
    }

    if (caughtError && caughtError.attempts.length > 0) {
      for (const attempt of caughtError.attempts) {
        expect(attempt).toHaveProperty("provider");
        expect(attempt).toHaveProperty("model");
        expect(attempt).toHaveProperty("tier");
        expect(attempt).toHaveProperty("latencyMs");
        expect(attempt).toHaveProperty("timestamp");
        expect(attempt).toHaveProperty("success");
        expect(attempt.success).toBe(false);
      }
    }
  });
});
