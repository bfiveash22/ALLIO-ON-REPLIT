import { describe, it, expect, vi } from "vitest";
import { requireAuth, requireRole } from "../artifacts/api-server/src/working-auth";
import {
  createMockRequest,
  createMockResponse,
  createAuthenticatedRequest,
} from "./helpers";
import {
  insertPatientRecordSchema,
  insertPatientProtocolSchema,
  insertMemberEnrollmentSchema,
  insertDoctorOnboardingSchema,
  insertProgramEnrollmentSchema,
} from "../lib/shared/src/schema";

describe("doctor route authorization", () => {
  const doctorRouteRoles = ["admin", "doctor"];

  it("allows admin users to access doctor routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...doctorRouteRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows doctor users to access doctor routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...doctorRouteRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows physician users to access doctor routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["physician"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...doctorRouteRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies member users from doctor routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["subscriber"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...doctorRouteRoles);
    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies clinic_owner users from doctor routes", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["clinic_owner"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...doctorRouteRoles);
    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("protocol assembly route authorization", () => {
  const protocolRoles = ["admin", "trustee", "doctor"];

  it("allows admin users to generate protocols", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["administrator"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...protocolRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows doctor users to generate protocols", async () => {
    const req = createAuthenticatedRequest({ wpRoles: ["doctor"] });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...protocolRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows blake (trustee) to generate protocols via admin mapping", async () => {
    const req = createAuthenticatedRequest({
      email: "blake@forgottenformula.com",
      wpRoles: ["administrator"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...protocolRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows shop_manager to generate protocols via admin mapping", async () => {
    const req = createAuthenticatedRequest({
      wpRoles: ["shop_manager"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...protocolRoles);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies regular members from protocol generation", async () => {
    const req = createAuthenticatedRequest({
      email: "member@example.com",
      wpRoles: ["subscriber"],
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...protocolRoles);
    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies unauthenticated users from protocol generation", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole(...protocolRoles);
    await middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("member route authorization", () => {
  it("requireAuth blocks unauthenticated access to member routes", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAuth allows authenticated member access", () => {
    const req = createAuthenticatedRequest({ wpRoles: ["subscriber"] });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("patient record data validation for doctor operations", () => {
  it("validates patient record creation payload", () => {
    const validPayload = insertPatientRecordSchema.safeParse({
      doctorId: "doctor-abc",
      memberId: "member-xyz",
      memberName: "Alice Johnson",
      memberEmail: "alice@example.com",
      phone: "555-1234",
      status: "active",
      primaryConcerns: ["fatigue", "insomnia"],
      currentMedications: ["melatonin"],
    });
    expect(validPayload.success).toBe(true);
  });

  it("rejects patient record without required doctor and member fields", () => {
    const noDoctorOrMember = insertPatientRecordSchema.safeParse({
      memberEmail: "alice@example.com",
    });
    expect(noDoctorOrMember.success).toBe(false);
  });

  it("validates patient record status enum", () => {
    const invalidStatus = insertPatientRecordSchema.safeParse({
      doctorId: "doctor-abc",
      memberId: "member-xyz",
      memberName: "Alice Johnson",
      status: "nonexistent_status",
    });
    expect(invalidStatus.success).toBe(false);
  });
});

describe("patient protocol data validation for doctor operations", () => {
  it("validates protocol creation payload with clinical data", () => {
    const validPayload = insertPatientProtocolSchema.safeParse({
      patientRecordId: "record-abc",
      doctorId: "doctor-xyz",
      protocolName: "Heavy Metal Detox Protocol",
      protocolType: "supplement",
      description: "12-week chelation support protocol",
      status: "draft",
      products: [
        { name: "DMSA", dose: "100mg", frequency: "3x/week" },
        { name: "Chlorella", dose: "3g", frequency: "daily" },
      ],
      schedule: { weekdays: "morning and evening", weekends: "morning only" },
      duration: "12 weeks",
      expectedOutcomes: ["Reduced mercury levels", "Improved cognitive function"],
    });
    expect(validPayload.success).toBe(true);
  });

  it("rejects protocol without required fields", () => {
    const missingFields = insertPatientProtocolSchema.safeParse({
      description: "Orphan protocol",
    });
    expect(missingFields.success).toBe(false);
  });

  it("validates protocol status enum values", () => {
    const validStatuses = ["draft", "active", "paused", "completed", "discontinued"];
    for (const status of validStatuses) {
      const result = insertPatientProtocolSchema.safeParse({
        patientRecordId: "record-1",
        doctorId: "doctor-1",
        protocolName: "Test Protocol",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid protocol status", () => {
    const result = insertPatientProtocolSchema.safeParse({
      patientRecordId: "record-1",
      doctorId: "doctor-1",
      protocolName: "Test Protocol",
      status: "archived",
    });
    expect(result.success).toBe(false);
  });
});

describe("program enrollment data validation for member operations", () => {
  it("validates program enrollment creation", () => {
    const result = insertProgramEnrollmentSchema.safeParse({
      userId: "user-123",
      programId: "program-456",
      status: "active",
      progress: 0,
    });
    expect(result.success).toBe(true);
  });

  it("requires userId and programId", () => {
    const noUser = insertProgramEnrollmentSchema.safeParse({
      programId: "program-456",
    });
    expect(noUser.success).toBe(false);

    const noProgram = insertProgramEnrollmentSchema.safeParse({
      userId: "user-123",
    });
    expect(noProgram.success).toBe(false);
  });
});

describe("doctor onboarding data validation", () => {
  it("validates complete onboarding payload", () => {
    const result = insertDoctorOnboardingSchema.safeParse({
      email: "newdoc@clinic.com",
      fullName: "Dr. Sarah Williams",
      clinicName: "Wellness Center",
      licenseNumber: "MD-98765",
      practiceType: "MD",
      phone: "555-8888",
      status: "started",
      referredBy: "Dr. Blake",
      notes: "Referred by founding member",
    });
    expect(result.success).toBe(true);
  });

  it("tracks onboarding status through workflow", () => {
    const workflow = [
      "started",
      "document_sent",
      "document_signed",
      "payment_pending",
      "completed",
    ];

    for (const status of workflow) {
      const result = insertDoctorOnboardingSchema.safeParse({
        email: "doc@test.com",
        fullName: "Dr. Test",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("validates cancellation status", () => {
    const result = insertDoctorOnboardingSchema.safeParse({
      email: "doc@test.com",
      fullName: "Dr. Test",
      status: "cancelled",
    });
    expect(result.success).toBe(true);
  });
});

describe("member enrollment data validation", () => {
  it("validates complete enrollment with doctor code linkage", () => {
    const result = insertMemberEnrollmentSchema.safeParse({
      email: "newmember@example.com",
      fullName: "Bob Smith",
      phone: "555-0001",
      doctorCode: "DR-XYZ789",
      status: "started",
    });
    expect(result.success).toBe(true);
  });

  it("requires doctor code for member enrollment", () => {
    const noDoctorCode = insertMemberEnrollmentSchema.safeParse({
      email: "newmember@example.com",
      fullName: "Bob Smith",
    });
    expect(noDoctorCode.success).toBe(false);
  });
});
