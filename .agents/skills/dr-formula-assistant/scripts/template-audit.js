#!/usr/bin/env node

const REQUIRED_SECTIONS = [
  { key: "rootCauseAnalysis", label: "Root Cause Analysis", minItems: 1 },
  { key: "phases", label: "Treatment Phases (5 Rs)", minItems: 3 },
  { key: "dailySchedule", label: "Daily Schedule", type: "object" },
  { key: "followUpPlan", label: "Follow-Up Plan", minItems: 1 },
  { key: "labsRequired", label: "Lab Orders", minItems: 1 },
];

const OPTIONAL_SECTIONS = [
  { key: "injectablePeptides", label: "Injectable Peptides" },
  { key: "oralPeptides", label: "Oral Peptides" },
  { key: "bioregulators", label: "Bioregulators" },
  { key: "supplements", label: "Supplements" },
  { key: "ivTherapies", label: "IV Therapies" },
  { key: "imTherapies", label: "IM Therapies" },
  { key: "detoxProtocols", label: "Detox Protocols" },
  { key: "parasiteAntiviralProtocols", label: "Parasite/Antiviral Protocols" },
  { key: "lifestyleRecommendations", label: "Lifestyle Recommendations" },
  { key: "dietaryGuidelines", label: "Dietary Guidelines" },
  { key: "contraindications", label: "Contraindications" },
];

function estimatePageCount(protocol) {
  let charCount = 0;

  function countChars(obj) {
    if (typeof obj === "string") return obj.length;
    if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + countChars(item), 0);
    if (typeof obj === "object" && obj !== null) {
      return Object.values(obj).reduce((sum, val) => sum + countChars(val), 0);
    }
    return String(obj).length;
  }

  charCount = countChars(protocol);
  return Math.max(1, Math.round(charCount / 3000));
}

function auditTemplate(protocol) {
  const errors = [];
  const warnings = [];
  const passes = [];
  const sections = { present: [], missing: [] };

  if (!protocol || typeof protocol !== "object") {
    return {
      valid: false,
      errors: ["Protocol data is missing or invalid"],
      warnings: [],
      passes: [],
      sections,
      estimatedPages: 0,
    };
  }

  REQUIRED_SECTIONS.forEach((section) => {
    const value = protocol[section.key];
    if (section.type === "object") {
      if (value && typeof value === "object" && Object.keys(value).length > 0) {
        passes.push(`Required section "${section.label}" present`);
        sections.present.push(section.label);
      } else {
        errors.push(`Required section "${section.label}" is missing or empty`);
        sections.missing.push(section.label);
      }
    } else {
      if (Array.isArray(value) && value.length >= (section.minItems || 1)) {
        passes.push(`Required section "${section.label}" present with ${value.length} item(s)`);
        sections.present.push(section.label);
      } else {
        errors.push(`Required section "${section.label}" is missing or has insufficient items (need ${section.minItems || 1}+)`);
        sections.missing.push(section.label);
      }
    }
  });

  OPTIONAL_SECTIONS.forEach((section) => {
    const value = protocol[section.key];
    if (Array.isArray(value) && value.length > 0) {
      passes.push(`Optional section "${section.label}" present with ${value.length} item(s)`);
      sections.present.push(section.label);
    } else {
      warnings.push(`Optional section "${section.label}" is empty or missing`);
    }
  });

  if (protocol.dailySchedule) {
    const periods = ["morning", "midday", "evening", "bedtime"];
    const hasMorningEvening =
      protocol.dailySchedule.morning?.length > 0 && protocol.dailySchedule.evening?.length > 0;

    if (hasMorningEvening) {
      passes.push("Daily schedule has morning and evening sections");
    } else {
      warnings.push("Daily schedule should have at minimum morning and evening sections");
    }

    const hasChecklistFormat = periods.some((p) =>
      protocol.dailySchedule[p]?.some((item) => item.item && typeof item.item === "string")
    );
    if (hasChecklistFormat) {
      passes.push("Daily schedule uses structured checklist format");
    } else {
      warnings.push("Daily schedule items should use structured {item, details, frequency} format");
    }
  }

  const estimatedPages = estimatePageCount(protocol);
  if (estimatedPages < 5) {
    errors.push(`Protocol too short: estimated ${estimatedPages} pages (minimum 5 pages required)`);
  } else if (estimatedPages >= 5 && estimatedPages <= 10) {
    passes.push(`Protocol length acceptable: estimated ${estimatedPages} pages`);
  } else {
    passes.push(`Protocol comprehensive: estimated ${estimatedPages} pages`);
  }

  if (!protocol.patientName) warnings.push("Patient name is missing");
  if (!protocol.patientAge) warnings.push("Patient age is missing");
  if (!protocol.generatedDate) warnings.push("Generated date is missing");
  if (!protocol.protocolDurationDays) warnings.push("Protocol duration is missing");
  if (!protocol.summary) warnings.push("Protocol summary is missing");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    passes,
    sections,
    estimatedPages,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { auditTemplate, REQUIRED_SECTIONS, OPTIONAL_SECTIONS };
}

if (typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("template-audit")) {
  const fs = require("fs");
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error("Usage: node template-audit.js <protocol.json>");
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
    const protocol = data.protocol || data;
    const result = auditTemplate(protocol);

    console.log("\n=== PROTOCOL TEMPLATE AUDIT ===\n");
    console.log(`Status: ${result.valid ? "PASS" : "FAIL"}`);
    console.log(`Estimated Pages: ${result.estimatedPages}`);
    console.log(`Sections Present: ${result.sections.present.length}`);
    console.log(`Sections Missing: ${result.sections.missing.length}\n`);

    if (result.errors.length > 0) {
      console.log("ERRORS:");
      result.errors.forEach((e) => console.log(`  ❌ ${e}`));
    }
    if (result.warnings.length > 0) {
      console.log("\nWARNINGS:");
      result.warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
    }
    if (result.passes.length > 0) {
      console.log("\nPASSED:");
      result.passes.forEach((p) => console.log(`  ✅ ${p}`));
    }

    process.exit(result.valid ? 0 : 1);
  } catch (err) {
    console.error("Failed to read/parse protocol file:", err.message);
    process.exit(1);
  }
}
