import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole, requireAuth } from "../artifacts/api-server/src/working-auth";
import {
  createMockRequest,
  createMockResponse,
  createAuthenticatedRequest,
} from "./helpers";

describe("admin route authorization", () => {
  const adminRoles = ["admin"] as const;

  it("allows administrator wp role to access admin routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...adminRoles)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows shop_manager wp role to access admin routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["shop_manager"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...adminRoles)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies subscriber wp role from admin routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["subscriber"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...adminRoles)(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies doctor role from admin-only routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...adminRoles)(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies unauthenticated requests with 401", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...adminRoles)(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("admin and trustee combined route authorization", () => {
  const combinedRoles = ["admin", "trustee"] as const;

  it("allows administrator to access admin+trustee routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...combinedRoles)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows trustee email (blake@forgottenformula.com) to access trustee routes", async () => {
    const req = createAuthenticatedRequest({
      email: "blake@forgottenformula.com",
      wpRoles: ["subscriber"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole("trustee")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies non-trustee subscriber from trustee-only routes", async () => {
    const req = createAuthenticatedRequest({
      email: "member@example.com",
      wpRoles: ["subscriber"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole("trustee")(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("protocol assembly route authorization", () => {
  const protocolRoles = ["admin", "trustee", "doctor"] as const;

  it("allows admin to access protocol assembly routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...protocolRoles)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows doctor to access protocol assembly routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...protocolRoles)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows physician to access protocol assembly routes via doctor role mapping", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["physician"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...protocolRoles)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies subscriber from protocol assembly routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["subscriber"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole(...protocolRoles)(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("payment route authorization", () => {
  it("requireAuth allows authenticated user through", () => {
    const req = createAuthenticatedRequest({ wpRoles: ["subscriber"] });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("requireAuth blocks unauthenticated user with 401", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("contract route authorization", () => {
  it("admin can access contract creation routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole("admin")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("doctor cannot access admin-only contract routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole("admin")(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("clinic role maps from doctor wpRole for contract access", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    await requireRole("clinic")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("member route authorization", () => {
  it("allows any authenticated user to access member-level routes", () => {
    const roles = ["subscriber", "administrator", "doctor", "physician"];

    for (const role of roles) {
      const req = createAuthenticatedRequest({ wpRoles: [role] });
      const res = createMockResponse();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    }
  });
});
