const HEALER_DOCTOR_PATTERNS = [
  "healer", "ff_healer", "practitioner", "um_healer",
  "ff_doctor", "um_doctor", "um_practitioner",
  "wellness_practitioner", "healthcare_provider"
];

export function resolveAppRole(wpRoles: string[]): string {
  const normalized = wpRoles.map(r => r.toLowerCase());
  if (normalized.includes("administrator")) return "admin";
  if (normalized.includes("clinic_owner")) return "clinic";
  if (normalized.includes("doctor") ||
      normalized.some(r => HEALER_DOCTOR_PATTERNS.includes(r) ||
                           r.includes("doctor") || r.includes("healer"))) {
    return "doctor";
  }
  return "member";
}

export function isHealerOrDoctorRole(wpRoles: string[]): boolean {
  const normalized = wpRoles.map(r => r.toLowerCase());
  return normalized.includes("doctor") ||
    normalized.some(r => HEALER_DOCTOR_PATTERNS.includes(r) ||
                         r.includes("doctor") || r.includes("healer"));
}
