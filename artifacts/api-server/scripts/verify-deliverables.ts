import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "generated-protocols");

const EXPECTED_FILES = [
  "Kathryn_Smith_Full_Protocol.pdf",
  "Kathryn_Smith_Peptide_Schedule.pdf",
  "Kathryn_Smith_Daily_Schedule.pdf",
  "Kathryn_Smith_Protocol_Presentation.pptx",
  "Annette_Gomer_Full_Protocol.pdf",
  "Annette_Gomer_Peptide_Schedule.pdf",
  "Annette_Gomer_Daily_Schedule.pdf",
  "Annette_Gomer_Protocol_Presentation.pptx",
  "Crop_Duster_80M_Full_Protocol.pdf",
  "Crop_Duster_80M_Peptide_Schedule.pdf",
  "Crop_Duster_80M_Daily_Schedule.pdf",
  "Crop_Duster_80M_Protocol_Presentation.pptx",
  "Breast_Cancer_75F_Full_Protocol.pdf",
  "Breast_Cancer_75F_Peptide_Schedule.pdf",
  "Breast_Cancer_75F_Daily_Schedule.pdf",
  "Breast_Cancer_75F_Protocol_Presentation.pptx",
];

function main() {
  console.log(`[Verify] Checking ${EXPECTED_FILES.length} expected deliverable files...`);
  console.log(`[Verify] Output directory: ${OUTPUT_DIR}\n`);

  let found = 0;
  let missing = 0;

  for (const fileName of EXPECTED_FILES) {
    const filePath = path.join(OUTPUT_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(0);
      console.log(`  [OK]    ${fileName} (${sizeKB} KB)`);
      found++;
    } else {
      console.error(`  [MISS]  ${fileName}`);
      missing++;
    }
  }

  console.log(`\n[Verify] ═══════════════════════════════════════════`);
  console.log(`[Verify] RESULT: ${found}/${EXPECTED_FILES.length} found, ${missing} missing`);

  if (missing === 0) {
    console.log(`[Verify] ALL ${EXPECTED_FILES.length} DELIVERABLES PRESENT`);
  } else {
    console.error(`[Verify] INCOMPLETE: ${missing} file(s) missing`);
    process.exit(1);
  }
  console.log(`[Verify] ═══════════════════════════════════════════`);
}

main();
