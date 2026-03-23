import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

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

const { wooCommerceService } = await import("../artifacts/api-server/src/services/woocommerce");
const { wordPressAuthService } = await import("../artifacts/api-server/src/services/wordpress-auth");
const { registerWooCommerceRoutes } = await import("../artifacts/api-server/src/routes/woocommerce-routes");

const NON_ACTIONABLE_STATUSES = ["pending", "on-hold", "cancelled", "refunded", "failed"];
const ACTIONABLE_STATUSES = ["completed", "processing"];

function makeApp(user: any = null) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.user = user;
    req.isAuthenticated = () => user !== null;
    next();
  });
  registerWooCommerceRoutes(app);
  return app;
}

const memberUser = { id: 1, email: "user@example.com", role: "member", wpRoles: [] };
const adminUser = { id: 2, email: "admin@example.com", role: "admin", wpRoles: ["administrator"] };

describe("POST /api/woocommerce/grant-access — route-level integration", () => {
  beforeEach(() => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
    vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const app = makeApp(null);
    const res = await request(app)
      .post("/api/woocommerce/grant-access")
      .send({ accessType: "product", wooOrderId: "123" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when wooOrderId is missing — fail-closed", async () => {
    const app = makeApp(memberUser);
    const res = await request(app)
      .post("/api/woocommerce/grant-access")
      .send({ accessType: "product" });
    expect(res.status).toBe(400);
    expect(res.body.granted).toBe(false);
    expect(res.body.error).toContain("wooOrderId");
  });

  it("returns 404 when WooCommerce order does not exist", async () => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
    const app = makeApp(memberUser);
    const res = await request(app)
      .post("/api/woocommerce/grant-access")
      .send({ accessType: "product", wooOrderId: "9999" });
    expect(res.status).toBe(404);
    expect(res.body.granted).toBe(false);
  });

  it("returns 403 when user email does not match order billing email (IDOR prevention)", async () => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
      id: 10,
      status: "completed",
      billing: { email: "other@example.com" },
      line_items: [],
      total: "50.00",
      currency: "USD",
    });
    const app = makeApp(memberUser);
    const res = await request(app)
      .post("/api/woocommerce/grant-access")
      .send({ accessType: "product", wooOrderId: "10" });
    expect(res.status).toBe(403);
    expect(res.body.granted).toBe(false);
    expect(res.body.error).toContain("permission");
  });

  describe("non-actionable statuses → 403 for matching user", () => {
    for (const status of NON_ACTIONABLE_STATUSES) {
      it(`blocks access for "${status}" order with clear reason`, async () => {
        vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
          id: 11,
          status,
          billing: { email: memberUser.email },
          line_items: [],
          total: "50.00",
          currency: "USD",
        });
        const app = makeApp(memberUser);
        const res = await request(app)
          .post("/api/woocommerce/grant-access")
          .send({ accessType: "product", wooOrderId: "11" });
        expect(res.status).toBe(403);
        expect(res.body.granted).toBe(false);
        expect(typeof res.body.error).toBe("string");
        expect(res.body.error.length).toBeGreaterThan(10);
        expect(res.body.orderStatus).toBe(status);
        expect(res.body.statusCategory).toBe("non-actionable");
      });
    }
  });

  describe("actionable statuses → 200 for matching user", () => {
    for (const status of ACTIONABLE_STATUSES) {
      it(`grants access for "${status}" order`, async () => {
        vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
          id: 12,
          status,
          billing: { email: memberUser.email },
          line_items: [{ id: 1, name: "Product", quantity: 1, total: "50.00", product_id: 42 }],
          total: "50.00",
          currency: "USD",
        });
        const app = makeApp(memberUser);
        const res = await request(app)
          .post("/api/woocommerce/grant-access")
          .send({ accessType: "product", wooOrderId: "12" });
        expect(res.status).toBe(200);
        expect(res.body.granted).toBe(true);
        expect(res.body.orderStatus).toBe(status);
        expect(res.body.statusCategory).toBe("actionable");
      });
    }
  });

  describe("admin can access any order regardless of billing email", () => {
    for (const status of ACTIONABLE_STATUSES) {
      it(`admin grants "${status}" order belonging to another user`, async () => {
        vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
          id: 20,
          status,
          billing: { email: "completely-different@example.com" },
          line_items: [],
          total: "200.00",
          currency: "USD",
        });
        const app = makeApp(adminUser);
        const res = await request(app)
          .post("/api/woocommerce/grant-access")
          .send({ accessType: "product", wooOrderId: "20" });
        expect(res.status).toBe(200);
        expect(res.body.granted).toBe(true);
      });
    }
  });

  describe("member-tier upgrade — authorization and role gating", () => {
    it("non-admin user cannot upgrade a different user (privilege escalation blocked)", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 30,
        status: "completed",
        billing: { email: memberUser.email },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const updateRoleSpy = vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
      const app = makeApp(memberUser);
      const res = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "30", targetUserId: "999", newRole: "doctor" });
      expect(res.status).toBe(403);
      expect(res.body.granted).toBe(false);
      expect(res.body.error).toContain("own account");
      expect(updateRoleSpy).not.toHaveBeenCalled();
    });

    it("non-admin user cannot assign privileged roles (doctor, clinic)", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 31,
        status: "completed",
        billing: { email: memberUser.email },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const updateRoleSpy = vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
      const app = makeApp(memberUser);
      const selfUpgradeReq = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "31", targetUserId: String(memberUser.id), newRole: "doctor" });
      expect(selfUpgradeReq.status).toBe(403);
      expect(selfUpgradeReq.body.granted).toBe(false);
      expect(selfUpgradeReq.body.error).toContain("privileged");
      expect(updateRoleSpy).not.toHaveBeenCalled();
    });

    it("non-admin user can upgrade own account to allowed role (practitioner)", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 32,
        status: "completed",
        billing: { email: memberUser.email },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const updateRoleSpy = vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
      const app = makeApp(memberUser);
      const res = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "32", targetUserId: String(memberUser.id), newRole: "practitioner" });
      expect(res.status).toBe(200);
      expect(res.body.granted).toBe(true);
      expect(updateRoleSpy).toHaveBeenCalledWith(memberUser.id, "practitioner");
    });

    it("admin can upgrade any user to privileged role (doctor)", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 33,
        status: "completed",
        billing: { email: "other@example.com" },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const updateRoleSpy = vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
      const app = makeApp(adminUser);
      const res = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "33", targetUserId: "5", newRole: "doctor" });
      expect(res.status).toBe(200);
      expect(res.body.granted).toBe(true);
      expect(res.body.newRole).toBe("doctor");
      expect(updateRoleSpy).toHaveBeenCalledWith(5, "doctor");
    });

    it("does NOT upgrade member tier for non-qualifying order (pending) — updateUserRole not called", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 34,
        status: "pending",
        billing: { email: adminUser.email },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const updateRoleSpy = vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
      const app = makeApp(adminUser);
      const res = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "34", targetUserId: "5", newRole: "doctor" });
      expect(res.status).toBe(403);
      expect(res.body.granted).toBe(false);
      expect(updateRoleSpy).not.toHaveBeenCalled();
    });

    it("does NOT upgrade member tier for cancelled order — updateUserRole not called", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 35,
        status: "cancelled",
        billing: { email: adminUser.email },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const updateRoleSpy = vi.spyOn(wordPressAuthService, "updateUserRole").mockResolvedValue({ success: true });
      const app = makeApp(adminUser);
      const res = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "35", targetUserId: "5", newRole: "doctor" });
      expect(res.status).toBe(403);
      expect(res.body.granted).toBe(false);
      expect(updateRoleSpy).not.toHaveBeenCalled();
    });

    it("returns 400 when member-tier is requested without targetUserId/newRole", async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 36,
        status: "completed",
        billing: { email: adminUser.email },
        line_items: [],
        total: "500.00",
        currency: "USD",
      });
      const app = makeApp(adminUser);
      const res = await request(app)
        .post("/api/woocommerce/grant-access")
        .send({ accessType: "member-tier", wooOrderId: "36" });
      expect(res.status).toBe(400);
      expect(res.body.granted).toBe(false);
    });
  });
});

describe("POST /api/checkout/stripe/create-session — WooCommerce status gating", () => {
  beforeEach(() => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const status of NON_ACTIONABLE_STATUSES) {
    it(`returns 403 for "${status}" woo order — checkout blocked before Stripe`, async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 100,
        status,
        billing: { email: memberUser.email },
        line_items: [],
        total: "99.00",
        currency: "USD",
      });
      const app = makeApp(memberUser);
      const res = await request(app)
        .post("/api/checkout/stripe/create-session")
        .send({
          lineItems: [{ price: "price_abc123", quantity: 1 }],
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
          wooOrderId: "100",
        });
      expect(res.status).toBe(403);
      expect(res.body.qualifies).toBe(false);
      expect(res.body.orderStatus).toBe(status);
      expect(res.body.statusCategory).toBe("non-actionable");
      expect(typeof res.body.error).toBe("string");
      expect(res.body.error.length).toBeGreaterThan(10);
    });
  }

  it("returns 403 if wooOrderId references another user's order (IDOR)", async () => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
      id: 101,
      status: "completed",
      billing: { email: "someone-else@example.com" },
      line_items: [],
      total: "99.00",
      currency: "USD",
    });
    const app = makeApp(memberUser);
    const res = await request(app)
      .post("/api/checkout/stripe/create-session")
      .send({
        lineItems: [{ price: "price_abc123", quantity: 1 }],
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        wooOrderId: "101",
      });
    expect(res.status).toBe(403);
    expect(res.body.qualifies).toBe(false);
  });

  it("returns 404 when wooOrderId is provided but order does not exist", async () => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
    const app = makeApp(memberUser);
    const res = await request(app)
      .post("/api/checkout/stripe/create-session")
      .send({
        lineItems: [{ price: "price_abc123", quantity: 1 }],
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        wooOrderId: "9999",
      });
    expect(res.status).toBe(404);
    expect(res.body.qualifies).toBe(false);
  });
});

describe("GET /api/woocommerce/orders/:id/verify-access — route-level integration", () => {
  beforeEach(() => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/woocommerce/orders/1/verify-access");
    expect(res.status).toBe(401);
  });

  it("returns 404 when order does not exist", async () => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue(null);
    const app = makeApp(memberUser);
    const res = await request(app).get("/api/woocommerce/orders/9999/verify-access");
    expect(res.status).toBe(404);
  });

  it("returns 403 for IDOR attempt (wrong user email vs order billing)", async () => {
    vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
      id: 40,
      status: "completed",
      billing: { email: "someone-else@example.com" },
      line_items: [],
      total: "100.00",
      currency: "USD",
    });
    const app = makeApp(memberUser);
    const res = await request(app).get("/api/woocommerce/orders/40/verify-access");
    expect(res.status).toBe(403);
    expect(res.body.qualifies).toBe(false);
  });

  for (const status of NON_ACTIONABLE_STATUSES) {
    it(`returns 403 for "${status}" order owned by user`, async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 50,
        status,
        billing: { email: memberUser.email },
        line_items: [],
        total: "100.00",
        currency: "USD",
      });
      const app = makeApp(memberUser);
      const res = await request(app).get("/api/woocommerce/orders/50/verify-access");
      expect(res.status).toBe(403);
      expect(res.body.qualifies).toBe(false);
      expect(typeof res.body.reason).toBe("string");
      expect(res.body.reason.length).toBeGreaterThan(10);
    });
  }

  for (const status of ACTIONABLE_STATUSES) {
    it(`returns 200 for "${status}" order owned by user`, async () => {
      vi.spyOn(wooCommerceService, "getOrderById").mockResolvedValue({
        id: 60,
        status,
        billing: { email: memberUser.email },
        line_items: [],
        total: "100.00",
        currency: "USD",
      });
      const app = makeApp(memberUser);
      const res = await request(app).get("/api/woocommerce/orders/60/verify-access");
      expect(res.status).toBe(200);
      expect(res.body.qualifies).toBe(true);
    });
  }
});
