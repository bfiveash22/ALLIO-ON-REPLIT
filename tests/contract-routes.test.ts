import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Express, type Request, type Response } from "express";

vi.mock("../artifacts/api-server/src/storage", () => {
  const mockStorage = {
    getContract: vi.fn(),
    getContractsByUser: vi.fn(),
    createContract: vi.fn(),
    updateContract: vi.fn(),
    getContractBySignNowId: vi.fn(),
    getAllContracts: vi.fn(),
    getClinicByWpId: vi.fn(),
  };
  return { storage: mockStorage };
});

vi.mock("../artifacts/api-server/src/services/signnow", () => ({
  signNowService: {
    createDoctorAgreement: vi.fn(),
    createMemberAgreement: vi.fn(),
    getDocumentRoles: vi.fn(),
    createEmbeddedInvite: vi.fn(),
    generateSigningLink: vi.fn(),
  },
}));

vi.mock("../artifacts/api-server/src/services/legal-documents", () => ({
  getTrusteeSigningDocuments: vi.fn().mockReturnValue([]),
}));

vi.mock("../artifacts/api-server/src/working-auth", () => ({
  requireRole: (..._roles: string[]) => (req: Request, _res: Response, next: Function) => {
    if (!(req as any).user) {
      (req as any).user = { claims: { sub: "test-admin-user" } };
    }
    next();
  },
  requireAuth: (req: Request, _res: Response, next: Function) => {
    if (!(req as any).user) {
      (req as any).user = { id: "test-user-id", claims: { sub: "test-user-id" } };
    }
    next();
  },
}));

import { storage } from "../artifacts/api-server/src/storage";
import { signNowService } from "../artifacts/api-server/src/services/signnow";
import { registerContractRoutes } from "../artifacts/api-server/src/routes/contract-routes";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  (app as any).request.user = undefined;
  registerContractRoutes(app);
  return app;
}

async function makeRequest(app: Express, method: "get" | "post" | "patch", path: string, body?: unknown): Promise<{ status: number; body: any }> {
  const http = await import("http");
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = (server.address() as any).port;
      const reqBody = body ? JSON.stringify(body) : undefined;
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
        resolve({ status: 500, body: { error: err.message } });
      });
      if (reqBody) req.write(reqBody);
      req.end();
    });
  });
}

describe("Contract Routes — POST /api/signnow/doctor-agreement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when doctorName or doctorEmail is missing", async () => {
    const app = buildApp();
    const res = await makeRequest(app, "post", "/api/signnow/doctor-agreement", {
      clinicName: "Test Clinic",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/doctorName.*doctorEmail|required/i);
  });

  it("uses reusable clinic link when clinic has signNowDoctorLink", async () => {
    const app = buildApp();
    vi.mocked(storage.getClinicByWpId).mockResolvedValue({
      id: "clinic-1",
      signNowDoctorLink: "https://signnow.example.com/reusable-link",
    } as any);
    vi.mocked(storage.createContract).mockResolvedValue({ id: "contract-1", status: "pending" } as any);

    const res = await makeRequest(app, "post", "/api/signnow/doctor-agreement", {
      doctorName: "Dr. Smith",
      doctorEmail: "dr@clinic.com",
    });

    expect(res.status).toBe(200);
    expect(res.body.signingUrl).toBe("https://signnow.example.com/reusable-link");
    expect(res.body.useReusableLink).toBe(true);
    expect(res.body.contractId).toBe("contract-1");
  });

  it("creates new signNow agreement when clinic has no reusable link", async () => {
    const app = buildApp();
    vi.mocked(storage.getClinicByWpId).mockResolvedValue(null as any);
    vi.mocked(signNowService.createDoctorAgreement).mockResolvedValue({
      documentId: "doc-123",
      signingUrl: "https://signnow.example.com/sign/doc-123",
    } as any);
    vi.mocked(storage.createContract).mockResolvedValue({ id: "contract-2", status: "pending" } as any);

    process.env.SIGNNOW_DOCTOR_TEMPLATE_ID = "template-abc";
    const res = await makeRequest(app, "post", "/api/signnow/doctor-agreement", {
      doctorName: "Dr. Jones",
      doctorEmail: "jones@hospital.com",
      templateId: "template-abc",
    });

    expect(res.status).toBe(200);
    expect(res.body.documentId).toBe("doc-123");
    expect(res.body.contractId).toBe("contract-2");
    delete process.env.SIGNNOW_DOCTOR_TEMPLATE_ID;
  });

  it("returns 500 when signNowService throws an error", async () => {
    const app = buildApp();
    vi.mocked(storage.getClinicByWpId).mockResolvedValue(null as any);
    vi.mocked(signNowService.createDoctorAgreement).mockRejectedValue(new Error("SignNow API error"));

    const res = await makeRequest(app, "post", "/api/signnow/doctor-agreement", {
      doctorName: "Dr. Fail",
      doctorEmail: "fail@clinic.com",
      templateId: "template-xyz",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
});

describe("Contract Routes — GET /api/contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns contracts for the authenticated user", async () => {
    const app = buildApp();
    const contracts = [
      { id: "c1", doctorName: "Dr. A", status: "pending", userId: "test-admin-user" },
      { id: "c2", doctorName: "Dr. B", status: "completed", userId: "test-admin-user" },
    ];
    vi.mocked(storage.getContractsByUser).mockResolvedValue(contracts as any);

    const res = await makeRequest(app, "get", "/api/contracts");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe("c1");
  });

  it("returns empty array when no contracts exist for user", async () => {
    const app = buildApp();
    vi.mocked(storage.getContractsByUser).mockResolvedValue([]);

    const res = await makeRequest(app, "get", "/api/contracts");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("Contract Routes — PATCH /api/contracts/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates and returns the contract", async () => {
    const app = buildApp();
    vi.mocked(storage.updateContract).mockResolvedValue({ id: "c1", status: "completed" } as any);

    const res = await makeRequest(app, "patch", "/api/contracts/c1", { status: "completed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("returns 404 when contract is not found", async () => {
    const app = buildApp();
    vi.mocked(storage.updateContract).mockResolvedValue(undefined);

    const res = await makeRequest(app, "patch", "/api/contracts/missing", { status: "completed" });
    expect(res.status).toBe(404);
  });
});

describe("Contract Routes — POST /api/signnow/member-agreement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when memberName or memberEmail is missing", async () => {
    const app = buildApp();
    const res = await makeRequest(app, "post", "/api/signnow/member-agreement", {
      clinicId: "1",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/memberName.*memberEmail|required/i);
  });

  it("returns 400 when no template is configured", async () => {
    const app = buildApp();
    vi.mocked(storage.getClinicByWpId).mockResolvedValue(null as any);
    delete process.env.SIGNNOW_MEMBER_TEMPLATE_ID;

    const res = await makeRequest(app, "post", "/api/signnow/member-agreement", {
      memberName: "Jane Member",
      memberEmail: "jane@example.com",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/template|not configured/i);
  });
});
