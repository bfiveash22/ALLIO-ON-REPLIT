import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express, { type Express, type Request, type Response } from "express";
import http from "http";

vi.mock("../artifacts/api-server/src/db", () => {
  const mockReturning = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, orderBy: vi.fn().mockResolvedValue([]) });
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  return { db: { select: mockSelect, insert: mockInsert, update: mockUpdate } };
});

vi.mock("../artifacts/api-server/src/working-auth", () => ({
  requireRole: (..._roles: string[]) => (req: Request, _res: Response, next: Function) => {
    if (!(req as any).user) {
      (req as any).user = { id: "test-admin", claims: { sub: "test-admin" } };
    }
    next();
  },
  requireAuth: (req: Request, _res: Response, next: Function) => {
    if (!(req as any).user) {
      (req as any).user = { id: "test-user-id", email: "test@example.com" };
    }
    next();
  },
}));

import { db } from "../artifacts/api-server/src/db";
import { registerPaymentRoutes } from "../artifacts/api-server/src/routes/payment-routes";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  registerPaymentRoutes(app);
  return app;
}

async function makeRequest(
  app: Express,
  method: "get" | "post" | "patch",
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
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
          ...headers,
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

describe("Payment Routes — POST /api/payments/create-checkout-session", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.assign(process.env, savedEnv);
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key];
    }
  });

  it("returns 400 when items array is missing", async () => {
    const app = buildApp();
    delete process.env.STRIPE_SECRET_KEY;

    const res = await makeRequest(app, "post", "/api/payments/create-checkout-session", {
      billing: { first_name: "John", last_name: "Doe", email: "john@example.com" },
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/items.*required/i);
  });

  it("returns 400 when items is an empty array", async () => {
    const app = buildApp();
    delete process.env.STRIPE_SECRET_KEY;

    const res = await makeRequest(app, "post", "/api/payments/create-checkout-session", {
      items: [],
      billing: { first_name: "John", last_name: "Doe", email: "john@example.com" },
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/items.*required/i);
  });

  it("returns 503 when STRIPE_SECRET_KEY is not configured", async () => {
    const app = buildApp();
    delete process.env.STRIPE_SECRET_KEY;

    const res = await makeRequest(app, "post", "/api/payments/create-checkout-session", {
      items: [{ productId: "prod-1", quantity: 1 }],
      billing: { first_name: "John", last_name: "Doe", email: "john@example.com" },
    });

    expect(res.status).toBe(503);
    expect((res.body as any).error).toMatch(/payment processing.*not configured/i);
  });

  it("returns 400 when product is not found in database", async () => {
    const app = buildApp();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";

    const mdb = db as any;
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });

    const res = await makeRequest(app, "post", "/api/payments/create-checkout-session", {
      items: [{ productId: "non-existent-product", quantity: 1 }],
      billing: { first_name: "Jane", last_name: "Doe", email: "jane@example.com" },
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/Product not found/i);
  });
});

describe("Payment Routes — GET /api/payments/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns payment history for authenticated user", async () => {
    const app = buildApp();
    const fakePayments = [
      { id: "pay-1", amount: "99.00", status: "completed", userId: "test-user-id" },
      { id: "pay-2", amount: "149.00", status: "completed", userId: "test-user-id" },
    ];
    const mdb = db as any;
    mdb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(fakePayments),
          }),
        }),
      }),
    });

    const res = await makeRequest(app, "get", "/api/payments/history");
    expect(res.status).toBe(200);
  });
});

describe("Payment Routes — GET /api/admin/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns admin payment list with pagination", async () => {
    const app = buildApp();
    const fakePayments = [{ id: "p1", amount: "200.00", userId: "u1" }];
    const mdb = db as any;

    let callCount = 0;
    mdb.select.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(fakePayments),
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        }),
      }),
    }));

    mdb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(fakePayments),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

    const res = await makeRequest(app, "get", "/api/admin/payments");
    expect(res.status).toBe(200);
    expect((res.body as any).payments).toBeDefined();
    expect((res.body as any).limit).toBe(50);
    expect((res.body as any).offset).toBe(0);
  });
});

describe("Payment Routes — input validation edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when items is not an array", async () => {
    const app = buildApp();
    delete process.env.STRIPE_SECRET_KEY;

    const res = await makeRequest(app, "post", "/api/payments/create-checkout-session", {
      items: "not-an-array",
      billing: { first_name: "John", last_name: "Doe", email: "john@example.com" },
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/items.*required/i);
  });

  it("product price validation rejects zero-price products", async () => {
    const app = buildApp();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";

    const mdb = db as any;
    mdb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: "prod-1",
          name: "Free Product",
          retailPrice: "0.00",
          imageUrl: null,
          shortDescription: null,
        }]),
      }),
    });

    const res = await makeRequest(app, "post", "/api/payments/create-checkout-session", {
      items: [{ productId: "prod-1", quantity: 1 }],
      billing: { first_name: "Jane", last_name: "Doe", email: "jane@example.com" },
    });

    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/invalid price/i);
  });
});
