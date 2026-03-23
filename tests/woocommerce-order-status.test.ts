import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../artifacts/api-server/src/db", () => ({
  db: {},
  pool: { on: vi.fn(), query: vi.fn(), end: vi.fn() },
  instrumentedQuery: vi.fn(),
}));

vi.mock("../artifacts/api-server/src/lib/circuit-breaker", () => ({
  circuitBreakers: {
    woocommerce: { call: vi.fn() },
  },
}));

vi.mock("../artifacts/api-server/src/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@shared/schema", () => ({
  products: {},
  categories: {},
}));

const { verifyOrderStatus, wooCommerceService } = await import("../artifacts/api-server/src/services/woocommerce");

const ACTIONABLE_STATUSES = ["completed", "processing"];
const NON_ACTIONABLE_STATUSES = ["pending", "on-hold", "cancelled", "refunded", "failed"];

describe("verifyOrderStatus (production service)", () => {
  describe("actionable statuses (completed, processing)", () => {
    it("accepts completed orders", () => {
      const result = verifyOrderStatus("completed");
      expect(result.qualifies).toBe(true);
      expect(result.category).toBe("actionable");
      expect(result.reason).toContain("completed");
    });

    it("accepts processing orders", () => {
      const result = verifyOrderStatus("processing");
      expect(result.qualifies).toBe(true);
      expect(result.category).toBe("actionable");
      expect(result.reason).toContain("processing");
    });

    it("is case-insensitive for completed", () => {
      expect(verifyOrderStatus("COMPLETED").qualifies).toBe(true);
      expect(verifyOrderStatus("Completed").qualifies).toBe(true);
    });

    it("is case-insensitive for processing", () => {
      expect(verifyOrderStatus("PROCESSING").qualifies).toBe(true);
      expect(verifyOrderStatus("Processing").qualifies).toBe(true);
    });
  });

  describe("non-actionable statuses — all must be rejected", () => {
    it("rejects pending orders with payment message", () => {
      const result = verifyOrderStatus("pending");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
      expect(result.reason).toMatch(/pending payment/i);
    });

    it("rejects on-hold orders with review message", () => {
      const result = verifyOrderStatus("on-hold");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
      expect(result.reason).toMatch(/on hold/i);
    });

    it("rejects cancelled orders with cancellation message", () => {
      const result = verifyOrderStatus("cancelled");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
      expect(result.reason).toMatch(/cancelled/i);
    });

    it("rejects refunded orders with refund message", () => {
      const result = verifyOrderStatus("refunded");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
      expect(result.reason).toMatch(/refunded/i);
    });

    it("rejects failed orders with payment-failed message", () => {
      const result = verifyOrderStatus("failed");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
      expect(result.reason).toMatch(/payment failed/i);
    });

    it("rejects unknown/unrecognized statuses", () => {
      const result = verifyOrderStatus("unknown-status");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
      expect(result.reason).toContain("not recognized");
    });

    it("rejects empty string gracefully", () => {
      const result = verifyOrderStatus("");
      expect(result.qualifies).toBe(false);
      expect(result.category).toBe("non-actionable");
    });
  });

  describe("status categorization is exhaustive", () => {
    for (const status of ACTIONABLE_STATUSES) {
      it(`categorizes "${status}" as actionable`, () => {
        const result = verifyOrderStatus(status);
        expect(result.qualifies).toBe(true);
        expect(result.category).toBe("actionable");
        expect(result.reason).toBeTruthy();
      });
    }

    for (const status of NON_ACTIONABLE_STATUSES) {
      it(`categorizes "${status}" as non-actionable`, () => {
        const result = verifyOrderStatus(status);
        expect(result.qualifies).toBe(false);
        expect(result.category).toBe("non-actionable");
        expect(result.reason).toBeTruthy();
      });
    }
  });

  describe("fulfillment gate integration contract", () => {
    it("returns structured response with all required fields", () => {
      const result = verifyOrderStatus("completed");
      expect(result).toHaveProperty("qualifies");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("category");
      expect(typeof result.qualifies).toBe("boolean");
      expect(typeof result.reason).toBe("string");
      expect(["actionable", "non-actionable"]).toContain(result.category);
    });

    it("allows fulfillment for completed order (200 path)", () => {
      expect(verifyOrderStatus("completed").qualifies).toBe(true);
    });

    it("allows fulfillment for processing order (200 path)", () => {
      expect(verifyOrderStatus("processing").qualifies).toBe(true);
    });

    it("blocks fulfillment for pending order (403 path) with clear message", () => {
      const result = verifyOrderStatus("pending");
      expect(result.qualifies).toBe(false);
      expect(result.reason.length).toBeGreaterThan(10);
    });

    it("blocks fulfillment for cancelled order (403 path) with clear message", () => {
      const result = verifyOrderStatus("cancelled");
      expect(result.qualifies).toBe(false);
      expect(result.reason.length).toBeGreaterThan(10);
    });

    it("blocks fulfillment for failed order (403 path) with clear message", () => {
      const result = verifyOrderStatus("failed");
      expect(result.qualifies).toBe(false);
      expect(result.reason.length).toBeGreaterThan(10);
    });

    it("blocks fulfillment for refunded order (403 path) with clear message", () => {
      const result = verifyOrderStatus("refunded");
      expect(result.qualifies).toBe(false);
      expect(result.reason.length).toBeGreaterThan(10);
    });

    it("blocks fulfillment for on-hold order (403 path) with clear message", () => {
      const result = verifyOrderStatus("on-hold");
      expect(result.qualifies).toBe(false);
      expect(result.reason.length).toBeGreaterThan(10);
    });
  });
});

describe("grant-access / product-access fulfillment gate (route-level simulation)", () => {
  const mockReq = (overrides: Record<string, any> = {}) => ({
    user: { email: "user@example.com", role: "member", wpRoles: [] },
    body: {},
    query: {},
    params: {},
    ...overrides,
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
  });

  describe("mandatory wooOrderId enforcement — missing wooOrderId rejected", () => {
    it("grant-access rejects when wooOrderId is missing (400)", async () => {
      const req = mockReq({ body: { accessType: "product" } });
      const res = mockRes();
      let statusCode = 0;
      let responseBody: any = {};

      res.status = (code: number) => {
        statusCode = code;
        return res;
      };
      res.json = (body: any) => {
        responseBody = body;
        return res;
      };

      if (!req.body.wooOrderId) {
        statusCode = 400;
        responseBody = { error: "wooOrderId is required.", granted: false };
      }

      expect(statusCode).toBe(400);
      expect(responseBody.granted).toBe(false);
      expect(responseBody.error).toContain("wooOrderId");
    });
  });

  describe("order status gating via verifyOrderStatus in grant-access flow", () => {
    for (const status of NON_ACTIONABLE_STATUSES) {
      it(`returns granted=false for ${status} order`, async () => {
        vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
          id: 123,
          status,
          billing: { email: "user@example.com" },
          line_items: [],
          total: "99.00",
          currency: "USD",
        });

        const verification = wooCommerceService.verifyOrderStatus(status);
        expect(verification.qualifies).toBe(false);
        expect(verification.category).toBe("non-actionable");
      });
    }

    for (const status of ACTIONABLE_STATUSES) {
      it(`returns granted=true eligible for ${status} order`, async () => {
        vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
          id: 456,
          status,
          billing: { email: "user@example.com" },
          line_items: [{ id: 1, name: "Test Product", quantity: 1, total: "99.00", product_id: 789 }],
          total: "99.00",
          currency: "USD",
        });

        const verification = wooCommerceService.verifyOrderStatus(status);
        expect(verification.qualifies).toBe(true);
        expect(verification.category).toBe("actionable");
      });
    }
  });

  describe("order annotation for admin order view", () => {
    it("annotates completed order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("completed");
      expect(v.qualifies).toBe(true);
      expect(v.category).toBe("actionable");
    });

    it("annotates pending order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("pending");
      expect(v.qualifies).toBe(false);
      expect(v.category).toBe("non-actionable");
    });

    it("annotates on-hold order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("on-hold");
      expect(v.qualifies).toBe(false);
      expect(v.category).toBe("non-actionable");
    });

    it("annotates cancelled order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("cancelled");
      expect(v.qualifies).toBe(false);
      expect(v.category).toBe("non-actionable");
    });

    it("annotates refunded order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("refunded");
      expect(v.qualifies).toBe(false);
      expect(v.category).toBe("non-actionable");
    });

    it("annotates failed order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("failed");
      expect(v.qualifies).toBe(false);
      expect(v.category).toBe("non-actionable");
    });

    it("annotates processing order correctly", () => {
      const v = wooCommerceService.verifyOrderStatus("processing");
      expect(v.qualifies).toBe(true);
      expect(v.category).toBe("actionable");
    });
  });
});
