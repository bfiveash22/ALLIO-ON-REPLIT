import { describe, it, expect } from "vitest";
import {
  sanitizePmaLanguage,
  sanitizeObjectStrings,
  PMA_TERMS,
  PMA_FORBIDDEN_PATTERNS,
  PMA_DISCLAIMER,
  PMA_PDF_FOOTER,
} from "../lib/shared/src/pma-language";

describe("sanitizePmaLanguage", () => {
  it("replaces 'patient' with 'member' (lowercase)", () => {
    expect(sanitizePmaLanguage("The patient needs care.")).toBe(
      "The member needs care."
    );
  });

  it("replaces 'Patient' with 'Member' (capitalized)", () => {
    expect(sanitizePmaLanguage("Patient John is here.")).toBe(
      "Member John is here."
    );
  });

  it("replaces 'patients' with 'members' (plural)", () => {
    expect(sanitizePmaLanguage("All patients should be informed.")).toBe(
      "All members should be informed."
    );
  });

  it("replaces 'Patients' with 'Members' (plural capitalized)", () => {
    expect(sanitizePmaLanguage("Patients need support.")).toBe(
      "Members need support."
    );
  });

  it("replaces 'diagnosis' with 'assessment' (lowercase)", () => {
    expect(sanitizePmaLanguage("The diagnosis is clear.")).toBe(
      "The assessment is clear."
    );
  });

  it("replaces 'Diagnosis' with 'Assessment' (capitalized)", () => {
    expect(sanitizePmaLanguage("Diagnosis was made.")).toBe(
      "Assessment was made."
    );
  });

  it("replaces 'diagnoses' with 'assessments'", () => {
    expect(sanitizePmaLanguage("Multiple diagnoses were found.")).toBe(
      "Multiple assessments were found."
    );
  });

  it("replaces 'diagnosed' with 'assessed'", () => {
    expect(sanitizePmaLanguage("She was diagnosed yesterday.")).toBe(
      "She was assessed yesterday."
    );
  });

  it("replaces 'prescribe' with 'suggest' (lowercase)", () => {
    expect(sanitizePmaLanguage("We prescribe vitamins.")).toBe(
      "We suggest vitamins."
    );
  });

  it("replaces 'prescribed' with 'suggested'", () => {
    expect(sanitizePmaLanguage("The doctor prescribed herbs.")).toBe(
      "The doctor suggested herbs."
    );
  });

  it("replaces 'prescription' with 'recommendation'", () => {
    expect(sanitizePmaLanguage("Please follow this prescription.")).toBe(
      "Please follow this recommendation."
    );
  });

  it("replaces 'cure' with 'restore' (lowercase)", () => {
    expect(sanitizePmaLanguage("We can cure the issue.")).toBe(
      "We can restore the issue."
    );
  });

  it("replaces 'Treatment Phases' with 'Wellness Phases'", () => {
    expect(sanitizePmaLanguage("Follow the Treatment Phases.")).toBe(
      "Follow the Wellness Phases."
    );
  });

  it("replaces 'treatment plan' with 'wellness protocol'", () => {
    expect(sanitizePmaLanguage("Your treatment plan is ready.")).toBe(
      "Your wellness protocol is ready."
    );
  });

  it("replaces 'treatment protocol' with 'wellness protocol'", () => {
    expect(sanitizePmaLanguage("Use this treatment protocol.")).toBe(
      "Use this wellness protocol."
    );
  });

  it("replaces 'treatment' with 'protocol' (lowercase)", () => {
    expect(sanitizePmaLanguage("The treatment is starting.")).toBe(
      "The protocol is starting."
    );
  });

  it("replaces 'medical advice' with 'wellness guidance'", () => {
    expect(sanitizePmaLanguage("Seek medical advice.")).toBe(
      "Seek wellness guidance."
    );
  });

  it("replaces 'doctor-patient' with 'doctor-member' (patient replaced first by word boundary)", () => {
    expect(sanitizePmaLanguage("The doctor-patient relationship.")).toBe(
      "The doctor-member relationship."
    );
  });

  it("replaces 'patient overview' — patient becomes member by word boundary rule", () => {
    expect(sanitizePmaLanguage("See the patient overview.")).toBe(
      "See the member overview."
    );
  });

  it("replaces 'patient' in 'patient care' with 'member' (care stays)", () => {
    expect(sanitizePmaLanguage("Improve patient care.")).toBe(
      "Improve member care."
    );
  });

  it("handles multiple replacements in a single string", () => {
    const input = "The patient diagnosis requires treatment.";
    const result = sanitizePmaLanguage(input);
    expect(result).not.toContain("patient");
    expect(result).not.toContain("diagnosis");
    expect(result).not.toContain("treatment");
    expect(result).toContain("member");
    expect(result).toContain("assessment");
  });

  it("returns non-string input coerced to string", () => {
    expect(sanitizePmaLanguage(null as any)).toBe("");
    expect(sanitizePmaLanguage(undefined as any)).toBe("");
    expect(sanitizePmaLanguage(42 as any)).toBe("42");
  });

  it("does not alter PMA-compliant text", () => {
    const clean = "The member has enrolled in the wellness protocol.";
    expect(sanitizePmaLanguage(clean)).toBe(clean);
  });
});

describe("sanitizeObjectStrings", () => {
  it("sanitizes a plain string", () => {
    expect(sanitizeObjectStrings("patient care")).toBe("member care");
  });

  it("sanitizes strings inside an object recursively", () => {
    const input = { note: "The patient diagnosis", nested: { text: "treatment plan" } };
    const result = sanitizeObjectStrings(input);
    expect((result as any).note).not.toContain("patient");
    expect((result as any).nested.text).not.toContain("treatment plan");
  });

  it("sanitizes strings inside an array", () => {
    const input = ["patient", "diagnosis"];
    const result = sanitizeObjectStrings(input);
    expect(result[0]).toBe("member");
    expect(result[1]).toBe("assessment");
  });

  it("passes through non-string primitives unchanged", () => {
    expect(sanitizeObjectStrings(42)).toBe(42);
    expect(sanitizeObjectStrings(true)).toBe(true);
    expect(sanitizeObjectStrings(null)).toBe(null);
  });

  it("handles deeply nested objects", () => {
    const input = { a: { b: { c: "patient" } } };
    const result = sanitizeObjectStrings(input) as any;
    expect(result.a.b.c).toBe("member");
  });
});

describe("PMA_TERMS constant", () => {
  it("maps patient to member", () => {
    expect(PMA_TERMS.patient).toBe("member");
    expect(PMA_TERMS.Patient).toBe("Member");
    expect(PMA_TERMS.PATIENT).toBe("MEMBER");
  });

  it("maps treatment to protocol", () => {
    expect(PMA_TERMS.treatment).toBe("protocol");
  });

  it("maps diagnosis to assessment", () => {
    expect(PMA_TERMS.diagnosis).toBe("assessment");
  });
});

describe("PMA_FORBIDDEN_PATTERNS", () => {
  it("has patterns for all core prohibited terms", () => {
    const terms = ["patient", "treatment plan", "medical advice", "diagnosis", "prescribe", "cure"];
    for (const term of terms) {
      const matches = PMA_FORBIDDEN_PATTERNS.some(p => p.test(term));
      expect(matches, `Pattern should match term: ${term}`).toBe(true);
    }
  });
});

describe("PMA_DISCLAIMER and PMA_PDF_FOOTER", () => {
  it("disclaimer contains key legal language", () => {
    expect(PMA_DISCLAIMER).toContain("private membership association");
    expect(PMA_DISCLAIMER).toContain("constitutional law");
  });

  it("PDF footer contains FFPMA branding", () => {
    expect(PMA_PDF_FOOTER).toContain("Forgotten Formula PMA");
    expect(PMA_PDF_FOOTER).toContain("Private Member Association");
  });
});
