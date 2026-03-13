import { describe, it, expect, vi } from "vitest";
import { requireAuth, requireRole } from "../artifacts/api-server/src/working-auth";
import {
  createMockRequest,
  createMockResponse,
  createAuthenticatedRequest,
  createMockPool,
} from "./helpers";

describe("requireAuth middleware", () => {
  it("rejects unauthenticated requests with 401", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows authenticated requests through", () => {
    const req = createAuthenticatedRequest();
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("rejects when session exists but userId is missing", () => {
    const req = createMockRequest({
      session: { user: { id: "123" } },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when session exists but user object is missing", () => {
    const req = createMockRequest({
      session: { userId: "123" },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireRole middleware", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin");
    await middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows users with exact matching role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["admin"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects users without the required role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["subscriber"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin");
    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows any of multiple specified roles", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin", "doctor");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("maps 'administrator' WP role to 'admin' Allio role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("maps 'administrator' WP role to 'trustee' Allio role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin", "trustee");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("maps 'shop_manager' WP role to 'admin' Allio role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["shop_manager"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("admin");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("maps 'doctor' WP role to 'clinic' Allio role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("clinic");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("maps 'physician' WP role to 'doctor' Allio role", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["physician"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("doctor");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("grants exclusive trustee access to blake by email", async () => {
    const req = createAuthenticatedRequest({
      email: "blake@example.com",
      wpRoles: ["subscriber"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("trustee");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies exclusive trustee access to non-blake non-admin users", async () => {
    const req = createAuthenticatedRequest({
      email: "alice@example.com",
      wpRoles: ["subscriber"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("trustee");
    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows administrator to access trustee-only routes", async () => {
    const req = createAuthenticatedRequest({
      email: "alice@example.com",
      wpRoles: ["administrator"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole("trustee");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  describe("API key fallback for admin routes", () => {
    it("accepts valid API key with read permissions for GET requests", async () => {
      const mockPool = createMockPool({
        api_keys: {
          rows: [{ id: "key-1", permissions: ["read"] }],
        },
      });

      const req = createMockRequest({
        method: "GET",
        headers: { authorization: "Bearer allio_test123" },
        pool: mockPool,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireRole("admin");
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.apiKeyId).toBe("key-1");
    });

    it("rejects API key without write permission for POST requests", async () => {
      const mockPool = createMockPool({
        api_keys: {
          rows: [{ id: "key-1", permissions: ["read"] }],
        },
      });

      const req = createMockRequest({
        method: "POST",
        headers: { authorization: "Bearer allio_test123" },
        pool: mockPool,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireRole("admin");
      await middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ error: "API key lacks write permission" });
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts API key with write permission for POST requests", async () => {
      const mockPool = createMockPool({
        api_keys: {
          rows: [{ id: "key-1", permissions: ["read", "write"] }],
        },
      });

      const req = createMockRequest({
        method: "POST",
        headers: { authorization: "Bearer allio_test123" },
        pool: mockPool,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireRole("admin");
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it("rejects invalid API key", async () => {
      const mockPool = createMockPool({
        api_keys: { rows: [] },
      });

      const req = createMockRequest({
        method: "GET",
        headers: { authorization: "Bearer allio_invalid" },
        pool: mockPool,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireRole("admin");
      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("does not allow API key fallback for non-admin roles", async () => {
      const mockPool = createMockPool({
        api_keys: {
          rows: [{ id: "key-1", permissions: ["read", "write"] }],
        },
      });

      const req = createMockRequest({
        method: "GET",
        headers: { authorization: "Bearer allio_test123" },
        pool: mockPool,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireRole("doctor");
      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("ignores non-allio bearer tokens", async () => {
      const mockPool = createMockPool({});

      const req = createMockRequest({
        method: "GET",
        headers: { authorization: "Bearer some-other-token" },
        pool: mockPool,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireRole("admin");
      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
