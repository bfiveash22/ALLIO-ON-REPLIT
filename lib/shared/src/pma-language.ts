export const PMA_TERMS = {
  patient: "member",
  Patient: "Member",
  PATIENT: "MEMBER",
  patients: "members",
  Patients: "Members",
  PATIENTS: "MEMBERS",
  treatment: "protocol",
  Treatment: "Protocol",
  TREATMENT: "PROTOCOL",
  diagnosis: "assessment",
  Diagnosis: "Assessment",
  prescribe: "suggest",
  Prescribe: "Suggest",
  cure: "restore",
  Cure: "Restore",
  "medical advice": "wellness guidance",
  "Medical Advice": "Wellness Guidance",
  "doctor-patient": "trustee-member",
  "Doctor-Patient": "Trustee-Member",
  "patient roster": "member roster",
  "patient list": "member roster",
  "patient education": "member education",
  "patient care": "member wellness",
  "patient protocol": "member protocol",
  "patient assessment": "member assessment",
  "patient information": "member information",
  "patient overview": "member overview",
  "Patient Overview": "Member Overview",
  "PATIENT OVERVIEW": "MEMBER OVERVIEW",
  "Treatment Phases": "Wellness Phases",
  "treatment plan": "wellness protocol",
} as const;

export const PMA_DISCLAIMER =
  "This document is intended solely for private membership association (PMA) use and does not constitute medical advice, " +
  "diagnosis, or treatment in the public domain. All protocols are wellness suggestions subject to Trustee review and refinement. " +
  "Members retain full sovereignty over their health decisions under constitutional law (1st and 14th Amendments).";

export const PMA_PDF_FOOTER =
  "Forgotten Formula PMA — Private Member Association | Not medical advice. For PMA members only.";

export function sanitizePmaLanguage(text: string): string {
  return text
    .replace(/\bpatients\b/gi, (match) => {
      if (match === "patients") return "members";
      if (match === "Patients") return "Members";
      if (match === "PATIENTS") return "MEMBERS";
      return "members";
    })
    .replace(/\bpatient\b/gi, (match) => {
      if (match === "patient") return "member";
      if (match === "Patient") return "Member";
      if (match === "PATIENT") return "MEMBER";
      return "member";
    })
    .replace(/\bTreatment Phases\b/g, "Wellness Phases")
    .replace(/\btreatment plan\b/gi, "wellness protocol")
    .replace(/\bmedical advice\b/gi, "wellness guidance")
    .replace(/\bdoctor-patient\b/gi, "trustee-member")
    .replace(/\bpatient overview\b/gi, "member overview")
    .replace(/\bpatient care\b/gi, "member wellness");
}

export function sanitizeObjectStrings<T>(obj: T): T {
  if (typeof obj === "string") return sanitizePmaLanguage(obj) as T;
  if (Array.isArray(obj)) return obj.map(sanitizeObjectStrings) as T;
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObjectStrings(value);
    }
    return result as T;
  }
  return obj;
}

export const PMA_FORBIDDEN_PATTERNS = [
  /\bpatient\b/i,
  /\bpatients\b/i,
  /\btreatment plan\b/i,
  /\bmedical advice\b/i,
  /\bdoctor-patient\b/i,
] as const;
