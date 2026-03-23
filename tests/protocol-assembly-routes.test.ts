import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Express, type Request, type Response } from "express";
import http from "http";

vi.mock("../artifacts/api-server/src/db", () => {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, orderBy: vi.fn().mockResolvedValue([]) });
  const mockReturning = vi.fn().mockResolvedValue([]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });

  return {
    db: {
      select: vi.fn().mockReturnValue({ from: mockFrom }),
      insert: vi.fn().mockReturnValue({ values: mockValues }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
    },
  };
});

vi.mock("../artifacts/api-server/src/working-auth", () => ({
  requireRole: (..._roles: string[]) => (req: Request, _res: Response, next: Function) => {
    if (!(req as any).user) {
      (req as any).user = { id: "admin-user", wpRoles: ["administrator"], claims: { sub: "admin-user" } };
    }
    next();
  },
  requireAuth: (req: Request, _res: Response, next: Function) => {
    if (!(req as any).user) {
      (req as any).user = { id: "admin-user", wpRoles: ["administrator"], claims: { sub: "admin-user" } };
    }
    next();
  },
}));

vi.mock("../artifacts/api-server/src/middleware/error-handler", () => {
  class MockAppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode = 500, code = "ERROR") {
      super(message);
      this.name = "AppError";
      this.statusCode = statusCode;
      this.code = code;
    }
  }

  return {
    asyncHandler: (fn: Function) => async (req: Request, res: Response, next: Function) => {
      try {
        await fn(req, res, next);
      } catch (err: any) {
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message, code: err.code });
      }
    },
    AppError: MockAppError,
  };
});

vi.mock("../artifacts/api-server/src/services/protocol-assembly", () => ({
  analyzeTranscript: vi.fn(),
  generateProtocol: vi.fn(),
  generateProtocolSlides: vi.fn(),
  profileFromIntakeForm: vi.fn(),
  saveProtocol: vi.fn(),
  updateProtocolSlides: vi.fn(),
  getProtocol: vi.fn(),
  listProtocols: vi.fn(),
  fetchProtocolCitations: vi.fn(),
  generateProtocolPDFBuffer: vi.fn(),
  generateDailySchedulePDFBuffer: vi.fn(),
  generatePeptideSchedulePDFBuffer: vi.fn(),
  runProtocolQA: vi.fn(),
  validateProtocolWithAgents: vi.fn(),
}));

import { db } from "../artifacts/api-server/src/db";
import {
  analyzeTranscript,
  generateProtocol,
  saveProtocol,
  validateProtocolWithAgents,
  listProtocols,
  getProtocol,
} from "../artifacts/api-server/src/services/protocol-assembly";
import { registerProtocolAssemblyRoutes } from "../artifacts/api-server/src/routes/protocol-assembly-routes";

async function buildApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  await registerProtocolAssemblyRoutes(app);
  return app;
}

async function makeRequest(
  app: Express,
  method: "get" | "post" | "patch",
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = (server.address() as any).port;
      const reqBody = body !== undefined ? JSON.stringify(body) : undefined;
      const opts = {
        hostname: "127.0.0.1",
        port,
        path,
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          ...(reqBody ? { "Content-Length": Buffer.byteLength(reqBody) } : {}),
        },
      };
      const req = http.request(opts, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          server.close();
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode!, body: data });
          }
        });
      });
      req.on("error", (err) => {
        server.close();
        resolve({ status: 500, body: { error: (err as Error).message } });
      });
      if (reqBody) req.write(reqBody);
      req.end();
    });
  });
}

describe("Protocol Assembly Routes — POST /api/protocol-assembly/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when transcript is missing", async () => {
    const app = await buildApp();
    const res = await makeRequest(app, "post", "/api/protocol-assembly/generate", {
      generateSlides: false,
    });
    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/transcript.*required/i);
  });

  it("returns 400 when transcript is not a string", async () => {
    const app = await buildApp();
    const res = await makeRequest(app, "post", "/api/protocol-assembly/generate", {
      transcript: { text: "not a string" },
    });
    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/transcript.*required/i);
  });

  it("returns an error when transcript exceeds 500k character limit", async () => {
    const app = await buildApp();
    const res = await makeRequest(app, "post", "/api/protocol-assembly/generate", {
      transcript: "a".repeat(500001),
    });
    expect([400, 413]).toContain(res.status);
  });

  it("generates protocol and returns result on success", async () => {
    const app = await buildApp();
    const fakeProfile = { name: "John Doe", age: 45, conditions: [] };
    const fakeProtocol = { phases: [], supplements: [], peptides: [] };
    const fakeValidation = { valid: true, issues: [], suggestions: [], catalogMatchRate: 95 };

    vi.mocked(analyzeTranscript).mockResolvedValue(fakeProfile as any);
    vi.mocked(generateProtocol).mockResolvedValue(fakeProtocol as any);
    vi.mocked(validateProtocolWithAgents).mockResolvedValue(fakeValidation as any);
    vi.mocked(saveProtocol).mockResolvedValue("new-protocol-id");

    const res = await makeRequest(app, "post", "/api/protocol-assembly/generate", {
      transcript: "Patient John Doe age 45 presents with...",
      generateSlides: false,
    });

    expect(res.status).toBe(200);
    const body = res.body as any;
    expect(body.id).toBe("new-protocol-id");
    expect(body.profile).toEqual(fakeProfile);
    expect(body.protocol).toEqual(fakeProtocol);
    expect(body.agentValidation).toEqual(fakeValidation);
    expect(body.qaStatus).toBe("draft");
  });

  it("sets qaStatus to needs_review when agent validation fails", async () => {
    const app = await buildApp();
    const fakeProfile = { name: "Jane Doe" };
    const fakeProtocol = { phases: [] };
    const failedValidation = { valid: false, issues: ["Missing peptide dosage", "Unclear timing"], suggestions: [], catalogMatchRate: 20 };

    vi.mocked(analyzeTranscript).mockResolvedValue(fakeProfile as any);
    vi.mocked(generateProtocol).mockResolvedValue(fakeProtocol as any);
    vi.mocked(validateProtocolWithAgents).mockResolvedValue(failedValidation as any);
    vi.mocked(saveProtocol).mockResolvedValue("review-protocol-id");

    const res = await makeRequest(app, "post", "/api/protocol-assembly/generate", {
      transcript: "Short patient notes",
    });

    expect(res.status).toBe(200);
    expect((res.body as any).qaStatus).toBe("needs_review");
  });

  it("returns 500 when analyzeTranscript service throws an error", async () => {
    const app = await buildApp();
    vi.mocked(analyzeTranscript).mockRejectedValue(new Error("AI service unavailable"));

    const res = await makeRequest(app, "post", "/api/protocol-assembly/generate", {
      transcript: "Patient details here.",
    });

    expect(res.status).toBe(500);
    expect((res.body as any).error).toBeTruthy();
  });
});

describe("Protocol Assembly Routes — GET /api/protocol-assembly/protocols", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of protocols for admin user as array", async () => {
    const app = await buildApp();
    const protocols = [
      { id: 1, patientName: "John Doe", qaStatus: "approved" },
      { id: 2, patientName: "Jane Smith", qaStatus: "draft" },
    ];
    vi.mocked(listProtocols).mockResolvedValue(protocols as any);

    const res = await makeRequest(app, "get", "/api/protocol-assembly/protocols");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as any[]).length).toBe(2);
  });

  it("returns empty array when no protocols exist", async () => {
    const app = await buildApp();
    vi.mocked(listProtocols).mockResolvedValue([]);

    const res = await makeRequest(app, "get", "/api/protocol-assembly/protocols");
    expect(res.status).toBe(200);
    expect((res.body as any[])).toEqual([]);
  });
});

describe("Protocol Assembly Routes — GET /api/protocol-assembly/protocols/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when id is not a valid number", async () => {
    const app = await buildApp();

    const res = await makeRequest(app, "get", "/api/protocol-assembly/protocols/not-a-number");
    expect(res.status).toBe(400);
  });

  it("returns 404 when protocol is not found by numeric id", async () => {
    const app = await buildApp();
    vi.mocked(getProtocol).mockResolvedValue(null as any);

    const res = await makeRequest(app, "get", "/api/protocol-assembly/protocols/999");
    expect(res.status).toBe(404);
  });

  it("returns the protocol when found by numeric id", async () => {
    const app = await buildApp();
    const protocol = { id: 42, patientName: "John Doe", protocol: {}, patientProfile: {}, qaStatus: "approved", doctorId: null };
    vi.mocked(getProtocol).mockResolvedValue(protocol as any);

    const res = await makeRequest(app, "get", "/api/protocol-assembly/protocols/42");
    expect(res.status).toBe(200);
    expect((res.body as any).id).toBe(42);
    expect((res.body as any).patientName).toBe("John Doe");
  });
});

describe("Protocol Assembly Routes — PATCH /api/protocol-assembly/protocols/:id/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when status is invalid", async () => {
    const app = await buildApp();

    const res = await makeRequest(app, "patch", "/api/protocol-assembly/protocols/1/status", {
      status: "invalid_status",
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/invalid status/i);
  });

  it("returns 400 when status is missing", async () => {
    const app = await buildApp();

    const res = await makeRequest(app, "patch", "/api/protocol-assembly/protocols/1/status", {});

    expect(res.status).toBe(400);
  });

  it("returns 404 when protocol is not found (numeric id)", async () => {
    const app = await buildApp();
    vi.mocked(getProtocol).mockResolvedValue(null as any);

    const res = await makeRequest(app, "patch", "/api/protocol-assembly/protocols/999/status", {
      status: "needs_review",
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 when approving a protocol without a doctorId", async () => {
    const app = await buildApp();
    const protocol = { id: 1, patientName: "Jane", qaStatus: "draft", doctorId: null };
    vi.mocked(getProtocol).mockResolvedValue(protocol as any);
    const mdb = db as any;
    mdb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) });

    const res = await makeRequest(app, "patch", "/api/protocol-assembly/protocols/1/status", {
      status: "approved",
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/doctor.*assign|approve/i);
  });
});
