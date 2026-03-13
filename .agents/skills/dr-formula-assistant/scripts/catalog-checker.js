#!/usr/bin/env node

const FFPMA_CATALOG_PRODUCTS = [
  "BPC-157", "TB-500", "Thymosin Beta-4", "BPC-157/TB-500 Blend", "GHK-Cu", "LL-37", "KPV",
  "KGLOW Blend", "Tesamorelin", "Ipamorelin", "Sermorelin", "CJC-1295/Ipamorelin Blend",
  "Tesamorelin/Ipamorelin Blend", "HGH", "Semaglutide", "Tirzepatide", "Retatrutide",
  "MOTS-C", "AICAR", "5-Amino-1MQ", "Thymosin Alpha-1", "TA-1", "ARA 290", "Thymogen",
  "Semax", "Selank", "Pinealon", "P21", "PE-22-28", "Humanin", "DSIP", "Cerebrolysin",
  "Epithalon", "NAD+", "PT-141", "Kisspeptin-10", "Oxytocin", "Melanotan II",
  "MitoSTAC", "Reds + Greens", "Elixir", "Bio-Vitamin", "Mighty Blue", "GlyNAC", "CoQ10",
  "ECS Suppository", "B17 Suppository", "DMSO Suppository", "Ivermectin Suppository",
  "Probiotic Suppository", "EDTA Suppository",
  "Vitamin C IV", "NAD+ IV", "Glutathione IV", "Myers' Cocktail", "EDTA IV",
  "Ozone IV", "H2O2 IV", "ALA IV", "DMSO IV",
  "Fenbendazole", "Ivermectin",
  "EDTA", "DMSA", "ALA",
  "Activated Charcoal", "Bentonite Clay", "Chlorella",
  "Milk Thistle", "NAC", "Glutathione",
  "CBD", "CBG", "CBN", "THC",
  "Lugol's Iodine", "Selenium", "Zinc", "Magnesium", "Copper",
  "Dr. Wallach's 90 Essential Nutrients"
];

const CATALOG_NORMALIZED = FFPMA_CATALOG_PRODUCTS.map((p) => p.toLowerCase().replace(/[^a-z0-9]/g, ""));

function normalizeProductName(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isInCatalog(productName) {
  const normalized = normalizeProductName(productName);
  return CATALOG_NORMALIZED.some(
    (cat) => normalized.includes(cat) || cat.includes(normalized)
  );
}

function checkCatalog(protocol) {
  const catalogMatches = [];
  const nonCatalogItems = [];
  const warnings = [];

  function checkProducts(items, category) {
    if (!items || !Array.isArray(items)) return;
    items.forEach((item) => {
      const name = item.name || item.item || "";
      if (!name) return;
      if (isInCatalog(name)) {
        catalogMatches.push({ name, category });
      } else {
        nonCatalogItems.push({ name, category });
      }
    });
  }

  checkProducts(protocol.injectablePeptides, "Injectable Peptides");
  checkProducts(protocol.oralPeptides, "Oral Peptides");
  checkProducts(protocol.bioregulators, "Bioregulators");
  checkProducts(protocol.supplements, "Supplements");
  checkProducts(protocol.ivTherapies, "IV Therapies");
  checkProducts(protocol.imTherapies, "IM Therapies");
  checkProducts(protocol.detoxProtocols, "Detox Protocols");
  checkProducts(protocol.parasiteAntiviralProtocols, "Antiparasitic/Antiviral");

  const totalProducts = catalogMatches.length + nonCatalogItems.length;
  const catalogPercentage = totalProducts > 0 ? Math.round((catalogMatches.length / totalProducts) * 100) : 0;

  if (catalogPercentage < 80) {
    warnings.push(`Only ${catalogPercentage}% of products match FFPMA catalog (target: 80%+)`);
  }

  if (nonCatalogItems.length > 0) {
    warnings.push(`${nonCatalogItems.length} product(s) not found in FFPMA catalog`);
  }

  return {
    valid: catalogPercentage >= 70,
    catalogMatches,
    nonCatalogItems,
    catalogPercentage,
    totalProducts,
    warnings,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { checkCatalog, isInCatalog, FFPMA_CATALOG_PRODUCTS };
}

if (typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("catalog-checker")) {
  const fs = require("fs");
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error("Usage: node catalog-checker.js <protocol.json>");
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
    const protocol = data.protocol || data;
    const result = checkCatalog(protocol);

    console.log("\n=== FFPMA CATALOG VERIFICATION ===\n");
    console.log(`Catalog Match Rate: ${result.catalogPercentage}%`);
    console.log(`Total Products: ${result.totalProducts}`);
    console.log(`In Catalog: ${result.catalogMatches.length}`);
    console.log(`Not in Catalog: ${result.nonCatalogItems.length}\n`);

    if (result.catalogMatches.length > 0) {
      console.log("MATCHED PRODUCTS:");
      result.catalogMatches.forEach((p) => console.log(`  ✅ ${p.name} (${p.category})`));
    }

    if (result.nonCatalogItems.length > 0) {
      console.log("\nNON-CATALOG PRODUCTS:");
      result.nonCatalogItems.forEach((p) => console.log(`  ⚠️  ${p.name} (${p.category})`));
    }

    if (result.warnings.length > 0) {
      console.log("\nWARNINGS:");
      result.warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
    }

    process.exit(result.valid ? 0 : 1);
  } catch (err) {
    console.error("Failed to read/parse protocol file:", err.message);
    process.exit(1);
  }
}
