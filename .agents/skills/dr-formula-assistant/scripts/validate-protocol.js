#!/usr/bin/env node

const FIVE_RS = ["REMOVE", "RESTORE", "REPLENISH", "REGENERATE", "REBALANCE"];

const INJECTABLE_DOSE_PATTERN = /\d+\s*(units?|mcg|mg|mL|IU)/i;
const RECONSTITUTION_PATTERN = /reconstitut|BAC\s*water|bacteriostatic|vial.*mL/i;

function validateProtocol(protocol) {
  const errors = [];
  const warnings = [];
  const passes = [];

  if (!protocol || typeof protocol !== "object") {
    return { valid: false, errors: ["Protocol data is missing or invalid"], warnings: [], passes: [], score: 0 };
  }

  if (!protocol.phases || !Array.isArray(protocol.phases) || protocol.phases.length === 0) {
    errors.push("No treatment phases defined");
  } else {
    const phaseNames = protocol.phases.map((p) => (p.name || "").toUpperCase());

    FIVE_RS.forEach((r, idx) => {
      const found = phaseNames.some(
        (name) => name.includes(r) || name.includes(r.substring(0, 4))
      );
      if (found) {
        passes.push(`Phase ${idx + 1} (${r}) present`);
      } else {
        errors.push(`Missing Phase ${idx + 1}: ${r}`);
      }
    });

    const correctOrder = FIVE_RS.every((r, idx) => {
      const foundIdx = phaseNames.findIndex(
        (name) => name.includes(r) || name.includes(r.substring(0, 4))
      );
      return foundIdx === -1 || foundIdx >= idx;
    });

    if (correctOrder) {
      passes.push("5 Rs phases are in correct order");
    } else {
      warnings.push("5 Rs phases may not be in the standard order (Remove → Restore → Replenish → Regenerate → Rebalance)");
    }
  }

  if (protocol.injectablePeptides && Array.isArray(protocol.injectablePeptides)) {
    protocol.injectablePeptides.forEach((pep) => {
      const doseStr = `${pep.dose || ""} ${pep.frequency || ""}`;
      if (!INJECTABLE_DOSE_PATTERN.test(doseStr)) {
        warnings.push(`Injectable "${pep.name}": dosing units may be missing (expected units/mcg/mg/mL)`);
      } else {
        passes.push(`Injectable "${pep.name}" has proper dosing units`);
      }

      const reconStr = `${pep.reconstitution || ""} ${pep.vialSize || ""} ${pep.notes || ""}`;
      if (!RECONSTITUTION_PATTERN.test(reconStr)) {
        warnings.push(`Injectable "${pep.name}": reconstitution instructions may be missing`);
      } else {
        passes.push(`Injectable "${pep.name}" has reconstitution instructions`);
      }
    });
  } else {
    warnings.push("No injectable peptides defined in protocol");
  }

  if (!protocol.rootCauseAnalysis || protocol.rootCauseAnalysis.length === 0) {
    errors.push("Root cause analysis is missing");
  } else {
    passes.push(`Root cause analysis present with ${protocol.rootCauseAnalysis.length} cause(s)`);
  }

  if (!protocol.dailySchedule) {
    errors.push("Daily schedule is missing");
  } else {
    const periods = ["morning", "midday", "evening", "bedtime"];
    periods.forEach((period) => {
      if (protocol.dailySchedule[period] && protocol.dailySchedule[period].length > 0) {
        passes.push(`Daily schedule: ${period} section present`);
      } else {
        warnings.push(`Daily schedule: ${period} section is empty`);
      }
    });
  }

  if (!protocol.summary || protocol.summary.length < 20) {
    warnings.push("Protocol summary is missing or too short");
  }

  const score = Math.round(
    (passes.length / (passes.length + errors.length + warnings.length * 0.5)) * 100
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    passes,
    score,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateProtocol, FIVE_RS };
}

if (typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("validate-protocol")) {
  const fs = require("fs");
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error("Usage: node validate-protocol.js <protocol.json>");
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
    const protocol = data.protocol || data;
    const result = validateProtocol(protocol);

    console.log("\n=== DR_FORMULA PROTOCOL VALIDATION ===\n");
    console.log(`Status: ${result.valid ? "PASS" : "FAIL"}`);
    console.log(`Score: ${result.score}%\n`);

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
