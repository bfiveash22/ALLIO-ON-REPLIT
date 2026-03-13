import type { Request, Response } from "express";

type MockSession = {
  userId?: string;
  user?: MockUser | null;
  save?: (cb: (err: Error | null) => void) => void;
  destroy?: (cb: (err: Error | null) => void) => void;
  [key: string]: unknown;
};

type MockUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  wpRoles: string[];
  wpUserId?: string;
  claims?: Record<string, unknown>;
  username?: string;
};

type MockRequest = Partial<Request> & {
  session: MockSession;
  user: MockUser | null;
  isAuthenticated: () => boolean;
  app: { locals: { pool: MockPool | null } };
  apiKeyId?: string;
  apiKeyPermissions?: string[];
};

type MockPool = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
};

type MockResponse = {
  statusCode: number;
  body: Record<string, unknown> | null;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (data: Record<string, unknown>) => MockResponse;
  set: (key: string, value: string) => MockResponse;
};

export function createMockRequest(overrides: Record<string, unknown> = {}): MockRequest {
  const session = (overrides.session as MockSession) || {};

  const req: MockRequest = {
    method: (overrides.method as string) || "GET",
    headers: (overrides.headers as Record<string, string>) || {},
    body: (overrides.body as Record<string, unknown>) || {},
    params: (overrides.params as Record<string, string>) || {},
    session,
    user: (session.user as MockUser) || (overrides.user as MockUser) || null,
    app: {
      locals: {
        pool: (overrides.pool as MockPool) || null,
      },
    },
    isAuthenticated: () => {
      return !!(req.session && req.session.userId && req.session.user);
    },
  };

  return req;
}

export function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: Record<string, unknown>) {
      res.body = data;
      return res;
    },
    set(key: string, value: string) {
      res.headers[key] = value;
      return res;
    },
  };
  return res;
}

export function createAuthenticatedRequest(
  user: Partial<MockUser> = {}
): MockRequest {
  const sessionUser: MockUser = {
    id: user.id || "test-user-id",
    email: user.email || "test@example.com",
    firstName: user.firstName || "Test",
    lastName: user.lastName || "User",
    wpRoles: user.wpRoles || ["subscriber"],
  };

  return createMockRequest({
    session: {
      userId: sessionUser.id,
      user: sessionUser,
    },
    user: sessionUser,
  });
}

export function createMockPool(queryResults: Record<string, unknown> = {}): MockPool {
  return {
    query: async (sql: string, params?: unknown[]) => {
      for (const [pattern, result] of Object.entries(queryResults)) {
        if (sql.includes(pattern)) {
          if (typeof result === "function") {
            return (result as (sql: string, params?: unknown[]) => { rows: Record<string, unknown>[]; rowCount: number })(sql, params);
          }
          return result as { rows: Record<string, unknown>[]; rowCount: number };
        }
      }
      return { rows: [], rowCount: 0 };
    },
  };
}

export function createMockStorage(overrides: Record<string, unknown> = {}): Record<string, (...args: unknown[]) => Promise<unknown>> {
  const defaultMethods: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    getPatientRecords: async () => [],
    getPatientRecord: async () => null,
    createPatientRecord: async (data: unknown) => ({ id: "new-patient-1", ...(data as Record<string, unknown>) }),
    updatePatientRecord: async (_id: unknown, data: unknown) => ({ id: _id, ...(data as Record<string, unknown>) }),
    getPatientProtocols: async () => [],
    getDoctorProtocols: async () => [],
    createPatientProtocol: async (data: unknown) => ({ id: "new-protocol-1", ...(data as Record<string, unknown>) }),
    updatePatientProtocol: async (_id: unknown, data: unknown) => ({ id: _id, ...(data as Record<string, unknown>) }),
    getPatientUploads: async () => [],
    createPatientUpload: async (data: unknown) => ({ id: "new-upload-1", ...(data as Record<string, unknown>) }),
    getPrograms: async () => [],
    getProgramBySlug: async () => null,
    getProgramEnrollment: async () => null,
    createProgramEnrollment: async (data: unknown) => ({ id: "new-enrollment-1", ...(data as Record<string, unknown>) }),
  };

  return { ...defaultMethods, ...overrides };
}
