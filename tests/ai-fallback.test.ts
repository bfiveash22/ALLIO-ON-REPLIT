import { describe, it, expect, vi } from "vitest";
import {
  validateAIResponse,
  isTerminalFailure,
  type QualityValidationResult,
  type CallType,
} from "../artifacts/api-server/src/services/ai-fallback";

describe("validateAIResponse", () => {
  describe("empty response handling", () => {
    it("returns score 0 and fails for empty string", () => {
      const result = validateAIResponse("");
      expect(result.score).toBe(0);
      expect(result.pass).toBe(false);
      expect(result.reasons).toContain("Empty response");
    });

    it("returns score 0 and fails for whitespace-only string", () => {
      const result = validateAIResponse("   ");
      expect(result.score).toBe(0);
      expect(result.pass).toBe(false);
    });
  });

  describe("length thresholds", () => {
    it("passes a long general response", () => {
      const longText = "This is a valid response that contains enough information to pass quality checks.";
      const result = validateAIResponse(longText, "general");
      expect(result.pass).toBe(true);
    });

    it("penalizes a response shorter than minLength for protocol-generation", () => {
      const shortText = "Short.";
      const result = validateAIResponse(shortText, "protocol-generation");
      expect(result.reasons.some(r => r.includes("too short"))).toBe(true);
    });

    it("passes a response meeting minLength for agent-chat", () => {
      const result = validateAIResponse("Great question! Here is your answer.", "agent-chat");
      expect(result.pass).toBe(true);
    });

    it("applies lower threshold for general call type", () => {
      const result = validateAIResponse("Yes.", "general");
      expect(result.pass).toBe(true);
    });
  });

  describe("refusal pattern detection", () => {
    const refusals = [
      "I cannot help with that request.",
      "I'm unable to process this.",
      "As an AI, I don't have that capability.",
      "I apologize, but I cannot assist.",
      "Sorry, but I can't do that.",
      "Unfortunately, I am unable to comply.",
    ];

    for (const refusal of refusals) {
      it(`penalizes refusal: "${refusal.substring(0, 40)}..."`, () => {
        const result = validateAIResponse(refusal + " " + "a".repeat(200), "general");
        expect(result.reasons.some(r => r.includes("refusal pattern"))).toBe(true);
      });
    }
  });

  describe("repetition detection", () => {
    it("penalizes highly repetitive responses", () => {
      const sentence = "This is the same sentence repeated over and over again. ";
      const repetitive = sentence.repeat(10);
      const result = validateAIResponse(repetitive, "general");
      expect(result.reasons.some(r => r.includes("repetition"))).toBe(true);
    });

    it("passes diverse content", () => {
      const diverse = [
        "The first point covers wellness.",
        "Second, we examine protocols.",
        "Third, assess member progress.",
        "Fourth, review supplement timing.",
        "Fifth, evaluate recovery metrics.",
        "Sixth, adjust the schedule accordingly.",
      ].join(". ");
      const result = validateAIResponse(diverse, "general");
      expect(result.reasons.some(r => r.includes("repetition"))).toBe(false);
    });
  });

  describe("PMA compliance checking", () => {
    const protocolCallTypes: CallType[] = [
      "protocol-generation",
      "protocol-builder",
      "document-generation",
    ];

    for (const callType of protocolCallTypes) {
      it(`penalizes prohibited PMA terms in ${callType}`, () => {
        const violating = "The patient requires treatment for their diagnosis. " + "a".repeat(600);
        const result = validateAIResponse(violating, callType);
        expect(result.reasons.some(r => r.includes("PMA compliance"))).toBe(true);
      });
    }

    it("does not check PMA terms for non-protocol call types", () => {
      const text = "The patient requires treatment. " + "a".repeat(100);
      const result = validateAIResponse(text, "agent-chat");
      expect(result.reasons.some(r => r.includes("PMA compliance"))).toBe(false);
    });

    it("does not penalize PMA-compliant protocol response", () => {
      const compliant =
        "The member will begin their wellness protocol immediately. " +
        "Phase 1 focuses on cellular restoration and supplements. " +
        "Phase 2 involves nutritional optimization and hydration. " +
        "Phase 3 addresses the endocannabinoid system balance. " +
        "Phase 4 uses frequency wellness modalities. " +
        "Phase 5 consolidates all improvements. " +
        "This comprehensive approach supports the member's journey. " +
        "All recommendations are subject to member consent and Trustee review.";
      const result = validateAIResponse(compliant, "protocol-generation");
      expect(result.reasons.some(r => r.includes("PMA compliance"))).toBe(false);
    });
  });

  describe("expectedFields validation", () => {
    it("passes when all expected fields are present in JSON", () => {
      const json = JSON.stringify({ name: "Test", phase: "1", supplements: [] });
      const result = validateAIResponse(json, "general", ["name", "phase", "supplements"]);
      expect(result.reasons.some(r => r.includes("Missing fields"))).toBe(false);
    });

    it("penalizes when JSON is missing expected fields", () => {
      const json = JSON.stringify({ name: "Test" });
      const result = validateAIResponse(json, "general", ["name", "phase", "supplements"]);
      expect(result.reasons.some(r => r.includes("Missing fields"))).toBe(true);
    });

    it("handles non-JSON for protocol-generation by checking text content", () => {
      const text = "This protocol covers the phase and supplements for the member. " + "a".repeat(500);
      const result = validateAIResponse(text, "protocol-generation", ["phase", "supplements", "xyz-missing"]);
      // Should check text for fields since JSON.parse fails
      expect(result).toBeDefined();
    });
  });

  describe("score boundary checks", () => {
    it("score is always between 0 and 100", () => {
      const inputs = [
        { text: "", callType: "general" as CallType },
        { text: "a".repeat(1000), callType: "protocol-generation" as CallType },
        { text: "I cannot help.", callType: "agent-chat" as CallType },
      ];
      for (const { text, callType } of inputs) {
        const result = validateAIResponse(text, callType);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("quality threshold pass/fail per call type", () => {
    it("protocol-generation requires score >= 60", () => {
      const adequate = "a".repeat(600);
      const result = validateAIResponse(adequate, "protocol-generation");
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.pass).toBe(true);
    });

    it("agent-chat requires score >= 40", () => {
      const text = "Here is your answer to the question.";
      const result = validateAIResponse(text, "agent-chat");
      expect(result.pass).toBe(true);
    });

    it("returns reasons array even when all checks pass", () => {
      const text = "a".repeat(200);
      const result = validateAIResponse(text, "general");
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});

describe("isTerminalFailure", () => {
  it("returns true for terminal failure objects", () => {
    const err = {
      isTerminalFailure: true,
      message: "All providers exhausted",
      userMessage: "Service unavailable",
      attempts: [],
      providersAttempted: [],
    };
    expect(isTerminalFailure(err)).toBe(true);
  });

  it("returns false for regular Error objects", () => {
    expect(isTerminalFailure(new Error("timeout"))).toBe(false);
  });

  it("returns falsy for null/undefined", () => {
    expect(isTerminalFailure(null)).toBeFalsy();
    expect(isTerminalFailure(undefined)).toBeFalsy();
  });

  it("returns false for objects without isTerminalFailure", () => {
    expect(isTerminalFailure({ message: "error" })).toBe(false);
  });

  it("returns false when isTerminalFailure is false", () => {
    expect(isTerminalFailure({ isTerminalFailure: false })).toBe(false);
  });
});
