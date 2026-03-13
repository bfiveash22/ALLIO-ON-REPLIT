import { describe, it, expect } from "vitest";
import type {
  PatientProfile,
  HealingProtocol,
  RootCause,
  ProtocolPhase,
  PeptideProtocol,
  SupplementProtocol,
  LifestyleRecommendation,
} from "../lib/shared/src/types/protocol-assembly";
import {
  insertGeneratedProtocolSchema,
} from "../lib/shared/src/schema";

describe("PatientProfile type contract", () => {
  it("validates a complete patient profile structure", () => {
    const profile: PatientProfile = {
      name: "Jane Doe",
      age: 45,
      gender: "female",
      location: "Austin, TX",
      callDate: "2026-03-01",
      chiefComplaints: ["fatigue", "brain fog", "joint pain"],
      currentDiagnoses: ["hypothyroidism"],
      currentMedications: ["levothyroxine 50mcg"],
      medicalTimeline: [
        { ageRange: "30-35", event: "Thyroid diagnosis", significance: "Primary endocrine issue" },
      ],
      rootCauses: [
        {
          rank: 1,
          cause: "Heavy metal toxicity",
          category: "primary",
          details: "Mercury from amalgam fillings",
          relatedSymptoms: ["fatigue", "brain fog"],
        },
      ],
      environmentalExposures: {
        moldExposure: false,
        heavyMetals: true,
        heavyMetalDetails: "Mercury amalgams",
        amalgamFillings: true,
        amalgamCount: 4,
        amalgamYears: 15,
        pesticides: false,
        radiation: false,
      },
      traumaHistory: {
        childhoodTrauma: false,
      },
      surgicalHistory: ["appendectomy"],
      gutHealth: {
        gallbladderRemoved: false,
        appendixRemoved: true,
        digestiveIssues: ["bloating"],
      },
      hormoneStatus: {
        thyroidIssues: "hypothyroid",
      },
      parasiteStatus: {
        everTreated: false,
      },
      dentalHistory: {
        amalgamFillings: true,
        rootCanals: 2,
      },
      deficiencies: ["vitamin D", "magnesium"],
      contraindications: [],
      goals: ["improve energy", "reduce brain fog"],
    };

    expect(profile.name).toBe("Jane Doe");
    expect(profile.chiefComplaints).toHaveLength(3);
    expect(profile.rootCauses[0].category).toBe("primary");
    expect(profile.environmentalExposures.amalgamFillings).toBe(true);
    expect(profile.dentalHistory.rootCanals).toBe(2);
  });

  it("validates root cause category enum constraint", () => {
    const validCategories = ["primary", "secondary", "tertiary", "quaternary", "quinary"] as const;
    validCategories.forEach((cat) => {
      const rootCause: RootCause = {
        rank: 1,
        cause: "test",
        category: cat,
        details: "test details",
        relatedSymptoms: [],
      };
      expect(rootCause.category).toBe(cat);
    });
  });

  it("validates protocol phase structure", () => {
    const phase: ProtocolPhase = {
      phaseNumber: 1,
      name: "Detox Phase",
      weekRange: "1-4",
      focus: "Heavy metal chelation",
      keyActions: ["Start chelation", "Support liver"],
    };
    expect(phase.phaseNumber).toBe(1);
    expect(phase.keyActions).toHaveLength(2);
  });

  it("validates peptide protocol structure", () => {
    const peptide: PeptideProtocol = {
      name: "BPC-157",
      vialSize: "5mg",
      reconstitution: "2ml BAC water",
      dose: "250mcg",
      frequency: "2x daily",
      duration: "4 weeks",
      route: "subcutaneous",
      purpose: "Gut healing and tissue repair",
    };
    expect(peptide.name).toBe("BPC-157");
    expect(peptide.route).toBe("subcutaneous");
  });

  it("validates supplement protocol structure", () => {
    const supplement: SupplementProtocol = {
      name: "Vitamin D3",
      dose: "5000 IU",
      timing: "morning with fat",
      purpose: "Correct deficiency",
    };
    expect(supplement.timing).toBe("morning with fat");
  });
});

describe("HealingProtocol type contract", () => {
  it("validates a complete healing protocol structure", () => {
    const protocol: HealingProtocol = {
      patientName: "Jane Doe",
      patientAge: 45,
      generatedDate: "2026-03-01",
      protocolDurationDays: 90,
      summary: "Comprehensive detox and restoration protocol",
      rootCauseAnalysis: [
        {
          rank: 1,
          cause: "Heavy metal toxicity",
          category: "primary",
          details: "Mercury from dental amalgams",
          relatedSymptoms: ["fatigue", "brain fog"],
        },
      ],
      phases: [
        {
          phaseNumber: 1,
          name: "Foundation",
          weekRange: "1-4",
          focus: "Prepare body for detox",
          keyActions: ["Open drainage pathways", "Support liver"],
        },
      ],
      dailySchedule: {
        morning: [{ item: "Vitamin D3", details: "5000 IU with breakfast" }],
        midday: [{ item: "Magnesium glycinate", details: "400mg" }],
        evening: [{ item: "Omega-3", details: "2g EPA/DHA" }],
        bedtime: [{ item: "Melatonin", details: "3mg" }],
      },
      injectablePeptides: [
        {
          name: "BPC-157",
          vialSize: "5mg",
          reconstitution: "2ml BAC water",
          dose: "250mcg",
          frequency: "2x daily",
          duration: "4 weeks",
          route: "subcutaneous",
          purpose: "Gut healing",
        },
      ],
      oralPeptides: [],
      bioregulators: [],
      supplements: [
        {
          name: "Vitamin D3",
          dose: "5000 IU",
          timing: "morning",
          purpose: "Correct deficiency",
        },
      ],
      ivTherapies: [],
      imTherapies: [],
      detoxProtocols: [
        {
          name: "Coffee Enema",
          method: "Organic coffee retention",
          frequency: "3x per week",
          duration: "12 weeks",
          instructions: "Use organic SA Wilson gold roast",
        },
      ],
      parasiteAntiviralProtocols: [],
      lifestyleRecommendations: [
        {
          category: "Sleep",
          recommendation: "8+ hours in dark room",
          details: "No screens 1hr before bed",
        },
      ],
      dietaryGuidelines: ["Anti-inflammatory diet", "Eliminate gluten"],
      followUpPlan: [
        { weekNumber: 4, action: "Lab recheck" },
        { weekNumber: 12, action: "Full protocol review" },
      ],
      contraindications: [],
      labsRequired: ["CBC", "CMP", "thyroid panel"],
    };

    expect(protocol.patientName).toBe("Jane Doe");
    expect(protocol.phases).toHaveLength(1);
    expect(protocol.dailySchedule.morning).toHaveLength(1);
    expect(protocol.injectablePeptides).toHaveLength(1);
    expect(protocol.detoxProtocols).toHaveLength(1);
    expect(protocol.followUpPlan).toHaveLength(2);
    expect(protocol.labsRequired).toContain("CBC");
  });

  it("validates lifestyle recommendation categories", () => {
    const recommendations: LifestyleRecommendation[] = [
      { category: "Sleep", recommendation: "8 hours minimum" },
      { category: "Exercise", recommendation: "30 min walking daily" },
      { category: "Stress", recommendation: "Daily meditation", details: "10 min guided" },
      { category: "Diet", recommendation: "Remove processed foods" },
    ];
    expect(recommendations).toHaveLength(4);
    expect(recommendations[2].details).toBe("10 min guided");
  });
});

describe("insertGeneratedProtocolSchema", () => {
  it("accepts valid generated protocol data", () => {
    const result = insertGeneratedProtocolSchema.safeParse({
      patientName: "Jane Doe",
      patientAge: 45,
      sourceType: "transcript",
      patientProfile: { name: "Jane Doe", age: 45, chiefComplaints: ["fatigue"] },
      protocol: { patientName: "Jane Doe", summary: "Test protocol" },
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("requires patientName, sourceType, patientProfile, and protocol", () => {
    const noName = insertGeneratedProtocolSchema.safeParse({
      sourceType: "transcript",
      patientProfile: {},
      protocol: {},
    });
    expect(noName.success).toBe(false);

    const noSource = insertGeneratedProtocolSchema.safeParse({
      patientName: "Jane Doe",
      patientProfile: {},
      protocol: {},
    });
    expect(noSource.success).toBe(false);

    const noProfile = insertGeneratedProtocolSchema.safeParse({
      patientName: "Jane Doe",
      sourceType: "transcript",
      protocol: {},
    });
    expect(noProfile.success).toBe(false);

    const noProtocol = insertGeneratedProtocolSchema.safeParse({
      patientName: "Jane Doe",
      sourceType: "transcript",
      patientProfile: {},
    });
    expect(noProtocol.success).toBe(false);
  });

  it("accepts intake_form as sourceType", () => {
    const result = insertGeneratedProtocolSchema.safeParse({
      patientName: "John Smith",
      sourceType: "intake_form",
      intakeFormId: 42,
      patientProfile: { name: "John Smith" },
      protocol: { patientName: "John Smith" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional memberId and notes", () => {
    const result = insertGeneratedProtocolSchema.safeParse({
      patientName: "Jane Doe",
      sourceType: "transcript",
      patientProfile: {},
      protocol: {},
      memberId: "member-123",
      notes: "First protocol attempt",
      generatedBy: "dr_blake",
    });
    expect(result.success).toBe(true);
  });

  it("omits id, createdAt, updatedAt", () => {
    const result = insertGeneratedProtocolSchema.safeParse({
      id: 999,
      patientName: "Jane Doe",
      sourceType: "transcript",
      patientProfile: {},
      protocol: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("createdAt");
      expect(result.data).not.toHaveProperty("updatedAt");
    }
  });
});
