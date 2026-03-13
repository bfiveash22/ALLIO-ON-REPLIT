#!/usr/bin/env node

const { validateProtocol } = require("./validate-protocol");
const { checkCatalog } = require("./catalog-checker");
const { auditTemplate } = require("./template-audit");

function generateQAReport(protocol, patientName) {
  const validationResult = validateProtocol(protocol);
  const catalogResult = checkCatalog(protocol);
  const templateResult = auditTemplate(protocol);

  const allErrors = [
    ...validationResult.errors.map((e) => ({ source: "Methodology", message: e })),
    ...catalogResult.warnings
      .filter((w) => w.includes("not found"))
      .map((w) => ({ source: "Catalog", message: w })),
    ...templateResult.errors.map((e) => ({ source: "Template", message: e })),
  ];

  const allWarnings = [
    ...validationResult.warnings.map((w) => ({ source: "Methodology", message: w })),
    ...catalogResult.warnings
      .filter((w) => !w.includes("not found"))
      .map((w) => ({ source: "Catalog", message: w })),
    ...templateResult.warnings.map((w) => ({ source: "Template", message: w })),
  ];

  const allPasses = [
    ...validationResult.passes.map((p) => ({ source: "Methodology", message: p })),
    ...templateResult.passes.map((p) => ({ source: "Template", message: p })),
  ];

  if (catalogResult.valid) {
    allPasses.push({
      source: "Catalog",
      message: `${catalogResult.catalogPercentage}% products from FFPMA catalog (${catalogResult.catalogMatches.length}/${catalogResult.totalProducts})`,
    });
  }

  const overallScore = Math.round(
    (validationResult.score * 0.4 +
      catalogResult.catalogPercentage * 0.3 +
      (templateResult.valid ? 100 : 50) * 0.3)
  );

  const overallValid =
    validationResult.valid && catalogResult.valid && templateResult.valid;

  let readiness;
  if (overallScore >= 90 && overallValid) {
    readiness = "READY FOR DELIVERY";
  } else if (overallScore >= 70) {
    readiness = "NEEDS MINOR REVISIONS";
  } else if (overallScore >= 50) {
    readiness = "NEEDS SIGNIFICANT REVISIONS";
  } else {
    readiness = "REJECT — MAJOR ISSUES";
  }

  return {
    patientName: patientName || protocol.patientName || "Unknown",
    timestamp: new Date().toISOString(),
    overallScore,
    overallValid,
    readiness,
    methodology: {
      valid: validationResult.valid,
      score: validationResult.score,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      passes: validationResult.passes,
    },
    catalog: {
      valid: catalogResult.valid,
      matchRate: catalogResult.catalogPercentage,
      totalProducts: catalogResult.totalProducts,
      catalogMatches: catalogResult.catalogMatches.length,
      nonCatalogItems: catalogResult.nonCatalogItems,
      warnings: catalogResult.warnings,
    },
    template: {
      valid: templateResult.valid,
      estimatedPages: templateResult.estimatedPages,
      sectionsPresent: templateResult.sections.present.length,
      sectionsMissing: templateResult.sections.missing,
      errors: templateResult.errors,
      warnings: templateResult.warnings,
      passes: templateResult.passes,
    },
    allErrors,
    allWarnings,
    allPasses,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateQAReport };
}

if (typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("qa-report")) {
  const fs = require("fs");
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error("Usage: node qa-report.js <protocol.json>");
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
    const protocol = data.protocol || data;
    const report = generateQAReport(protocol, data.patientName);

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║          DR_FORMULA QA REPORT                          ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");
    console.log(`Patient: ${report.patientName}`);
    console.log(`Date: ${report.timestamp}`);
    console.log(`Overall Score: ${report.overallScore}%`);
    console.log(`Readiness: ${report.readiness}\n`);
    console.log("─── METHODOLOGY VALIDATION ───");
    console.log(`  Status: ${report.methodology.valid ? "PASS" : "FAIL"} (${report.methodology.score}%)`);
    console.log(`  Errors: ${report.methodology.errors.length} | Warnings: ${report.methodology.warnings.length}\n`);
    console.log("─── CATALOG VERIFICATION ───");
    console.log(`  Status: ${report.catalog.valid ? "PASS" : "FAIL"} (${report.catalog.matchRate}%)`);
    console.log(`  Products: ${report.catalog.catalogMatches}/${report.catalog.totalProducts} in catalog\n`);
    console.log("─── TEMPLATE COMPLIANCE ───");
    console.log(`  Status: ${report.template.valid ? "PASS" : "FAIL"}`);
    console.log(`  Pages: ~${report.template.estimatedPages} | Sections: ${report.template.sectionsPresent}\n`);

    if (report.allErrors.length > 0) {
      console.log("ALL ERRORS:");
      report.allErrors.forEach((e) => console.log(`  ❌ [${e.source}] ${e.message}`));
    }

    if (report.allWarnings.length > 0) {
      console.log("\nALL WARNINGS:");
      report.allWarnings.forEach((w) => console.log(`  ⚠️  [${w.source}] ${w.message}`));
    }

    console.log(`\n${"═".repeat(58)}`);
    console.log(`VERDICT: ${report.readiness}`);
    console.log(`${"═".repeat(58)}\n`);

    process.exit(report.overallValid ? 0 : 1);
  } catch (err) {
    console.error("Failed to read/parse protocol file:", err.message);
    process.exit(1);
  }
}
