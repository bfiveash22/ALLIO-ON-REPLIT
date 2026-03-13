import { describe, it, expect } from "vitest";
import {
  insertMemberProfileSchema,
  insertDoctorOnboardingSchema,
  insertMemberEnrollmentSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertClinicSchema,
  insertProductSchema,
  insertPatientProtocolSchema,
  insertPatientRecordSchema,
} from "../lib/shared/src/schema";

describe("insertMemberProfileSchema", () => {
  it("accepts valid member profile data", () => {
    const result = insertMemberProfileSchema.safeParse({
      userId: "user-123",
      role: "member",
      phone: "555-1234",
      address: "123 Main St",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
    });
    expect(result.success).toBe(true);
  });

  it("requires userId", () => {
    const result = insertMemberProfileSchema.safeParse({
      role: "member",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role enum values", () => {
    const result = insertMemberProfileSchema.safeParse({
      userId: "user-123",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid role enum values", () => {
    const validRoles = ["admin", "doctor", "clinic", "member"];
    for (const role of validRoles) {
      const result = insertMemberProfileSchema.safeParse({
        userId: "user-123",
        role,
      });
      expect(result.success).toBe(true);
    }
  });

  it("does not allow id or createdAt (omitted fields)", () => {
    const result = insertMemberProfileSchema.safeParse({
      id: "should-be-ignored",
      userId: "user-123",
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("createdAt");
    }
  });
});

describe("insertDoctorOnboardingSchema", () => {
  it("accepts valid doctor onboarding data", () => {
    const result = insertDoctorOnboardingSchema.safeParse({
      email: "doctor@clinic.com",
      fullName: "Dr. Smith",
      clinicName: "Smith Clinic",
      licenseNumber: "MD12345",
      practiceType: "DC",
      phone: "555-9999",
    });
    expect(result.success).toBe(true);
  });

  it("requires email and fullName", () => {
    const noEmail = insertDoctorOnboardingSchema.safeParse({
      fullName: "Dr. Smith",
    });
    expect(noEmail.success).toBe(false);

    const noName = insertDoctorOnboardingSchema.safeParse({
      email: "doctor@clinic.com",
    });
    expect(noName.success).toBe(false);
  });

  it("accepts minimal required fields only", () => {
    const result = insertDoctorOnboardingSchema.safeParse({
      email: "doctor@clinic.com",
      fullName: "Dr. Smith",
    });
    expect(result.success).toBe(true);
  });

  it("omits id, createdAt, updatedAt, doctorCode, memberSignupUrl", () => {
    const result = insertDoctorOnboardingSchema.safeParse({
      id: "should-be-stripped",
      email: "doctor@clinic.com",
      fullName: "Dr. Smith",
      doctorCode: "DR-ABC123",
      memberSignupUrl: "/join/DR-ABC123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("doctorCode");
      expect(result.data).not.toHaveProperty("memberSignupUrl");
    }
  });

  it("accepts valid onboarding status values", () => {
    const statuses = [
      "started",
      "document_sent",
      "document_signed",
      "payment_pending",
      "completed",
      "cancelled",
    ];
    for (const status of statuses) {
      const result = insertDoctorOnboardingSchema.safeParse({
        email: "doc@test.com",
        fullName: "Dr. Test",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status values", () => {
    const result = insertDoctorOnboardingSchema.safeParse({
      email: "doc@test.com",
      fullName: "Dr. Test",
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });
});

describe("insertMemberEnrollmentSchema", () => {
  it("accepts valid enrollment data", () => {
    const result = insertMemberEnrollmentSchema.safeParse({
      email: "member@example.com",
      fullName: "Jane Doe",
      doctorCode: "DR-ABC123",
      phone: "555-0000",
    });
    expect(result.success).toBe(true);
  });

  it("requires email, fullName, and doctorCode", () => {
    const noDoctor = insertMemberEnrollmentSchema.safeParse({
      email: "member@example.com",
      fullName: "Jane Doe",
    });
    expect(noDoctor.success).toBe(false);

    const noEmail = insertMemberEnrollmentSchema.safeParse({
      fullName: "Jane Doe",
      doctorCode: "DR-ABC123",
    });
    expect(noEmail.success).toBe(false);

    const noName = insertMemberEnrollmentSchema.safeParse({
      email: "member@example.com",
      doctorCode: "DR-ABC123",
    });
    expect(noName.success).toBe(false);
  });
});

describe("insertOrderSchema", () => {
  it("accepts valid order data", () => {
    const result = insertOrderSchema.safeParse({
      userId: "user-123",
      subtotal: "99.99",
      total: "109.99",
      status: "pending",
    });
    expect(result.success).toBe(true);
  });

  it("requires userId, subtotal, and total", () => {
    const noUser = insertOrderSchema.safeParse({
      subtotal: "99.99",
      total: "109.99",
    });
    expect(noUser.success).toBe(false);

    const noSubtotal = insertOrderSchema.safeParse({
      userId: "user-123",
      total: "109.99",
    });
    expect(noSubtotal.success).toBe(false);

    const noTotal = insertOrderSchema.safeParse({
      userId: "user-123",
      subtotal: "99.99",
    });
    expect(noTotal.success).toBe(false);
  });

  it("accepts valid order status values", () => {
    const statuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    for (const status of statuses) {
      const result = insertOrderSchema.safeParse({
        userId: "user-123",
        subtotal: "10.00",
        total: "10.00",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid order status", () => {
    const result = insertOrderSchema.safeParse({
      userId: "user-123",
      subtotal: "10.00",
      total: "10.00",
      status: "refunded",
    });
    expect(result.success).toBe(false);
  });
});

describe("insertOrderItemSchema", () => {
  it("accepts valid order item data", () => {
    const result = insertOrderItemSchema.safeParse({
      orderId: "order-1",
      productId: "prod-1",
      quantity: 2,
      price: "49.99",
      total: "99.98",
    });
    expect(result.success).toBe(true);
  });

  it("requires all fields", () => {
    const result = insertOrderItemSchema.safeParse({
      orderId: "order-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("insertClinicSchema", () => {
  it("accepts valid clinic data", () => {
    const result = insertClinicSchema.safeParse({
      name: "Test Clinic",
      slug: "test-clinic",
      city: "Austin",
      state: "TX",
      email: "clinic@test.com",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = insertClinicSchema.safeParse({
      slug: "test-clinic",
    });
    expect(result.success).toBe(false);
  });

  it("accepts minimal data with just name", () => {
    const result = insertClinicSchema.safeParse({
      name: "Minimal Clinic",
    });
    expect(result.success).toBe(true);
  });
});

describe("insertProductSchema", () => {
  it("accepts valid product data", () => {
    const result = insertProductSchema.safeParse({
      name: "Test Product",
      slug: "test-product",
      retailPrice: "29.99",
      description: "A test product",
    });
    expect(result.success).toBe(true);
  });

  it("requires name, slug, and retailPrice", () => {
    const noName = insertProductSchema.safeParse({
      slug: "test",
      retailPrice: "29.99",
    });
    expect(noName.success).toBe(false);

    const noSlug = insertProductSchema.safeParse({
      name: "Test",
      retailPrice: "29.99",
    });
    expect(noSlug.success).toBe(false);

    const noPrice = insertProductSchema.safeParse({
      name: "Test",
      slug: "test",
    });
    expect(noPrice.success).toBe(false);
  });
});

describe("insertPatientProtocolSchema", () => {
  it("accepts valid patient protocol data", () => {
    const result = insertPatientProtocolSchema.safeParse({
      patientRecordId: "record-1",
      doctorId: "doctor-1",
      protocolName: "Treatment Protocol A",
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("requires patientRecordId, doctorId, and protocolName", () => {
    const noRecord = insertPatientProtocolSchema.safeParse({
      doctorId: "doctor-1",
      protocolName: "Protocol",
    });
    expect(noRecord.success).toBe(false);

    const noDoctor = insertPatientProtocolSchema.safeParse({
      patientRecordId: "record-1",
      protocolName: "Protocol",
    });
    expect(noDoctor.success).toBe(false);

    const noName = insertPatientProtocolSchema.safeParse({
      patientRecordId: "record-1",
      doctorId: "doctor-1",
    });
    expect(noName.success).toBe(false);
  });
});

describe("insertPatientRecordSchema", () => {
  it("accepts valid patient record data", () => {
    const result = insertPatientRecordSchema.safeParse({
      doctorId: "doctor-1",
      memberId: "member-1",
      memberName: "John Doe",
      memberEmail: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("requires doctorId, memberId, and memberName", () => {
    const noDoctor = insertPatientRecordSchema.safeParse({
      memberId: "member-1",
      memberName: "John Doe",
    });
    expect(noDoctor.success).toBe(false);

    const noMember = insertPatientRecordSchema.safeParse({
      doctorId: "doctor-1",
      memberName: "John Doe",
    });
    expect(noMember.success).toBe(false);

    const noName = insertPatientRecordSchema.safeParse({
      doctorId: "doctor-1",
      memberId: "member-1",
    });
    expect(noName.success).toBe(false);
  });
});
