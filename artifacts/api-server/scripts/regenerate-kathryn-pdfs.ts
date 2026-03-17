import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { buildKathrynSmithProfile } from "../src/services/kathryn-smith-protocol";
import {
  generateProtocolPDFBuffer,
  generateDailySchedulePDFBuffer,
  generatePeptideSchedulePDFBuffer,
  runDeterministicQAChecks,
} from "../src/services/protocol-assembly";
import { generateProtocolPPTX } from "../src/services/protocol-pptx";
import type { HealingProtocol, PatientProfile } from "@shared/types/protocol-assembly";

const MEMBER_NAME = "Kathryn Smith";
const OUTPUT_DIR = path.resolve(process.cwd(), "generated-protocols");

async function findProtocolRecord(): Promise<{ id: number; protocol: HealingProtocol; profile: PatientProfile }> {
  const records = await db
    .select()
    .from(generatedProtocols)
    .where(eq(generatedProtocols.patientName, MEMBER_NAME))
    .orderBy(desc(generatedProtocols.createdAt))
    .limit(1);

  if (!records.length || !records[0].protocol) {
    throw new Error(`No protocol data found for member "${MEMBER_NAME}"`);
  }

  const record = records[0];
  const protocol = record.protocol as unknown as HealingProtocol;
  const profile = record.patientProfile as unknown as PatientProfile;
  return { id: record.id, protocol, profile };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`[Regen] Looking up protocol for "${MEMBER_NAME}"...`);
  const { id, protocol, profile: storedProfile } = await findProtocolRecord();
  console.log(`[Regen] Found record id=${id}`);

  const profile = storedProfile || await buildKathrynSmithProfile();

  console.log(`[Regen] Protocol: ${protocol.patientName}, ${protocol.protocolDurationDays} days`);
  console.log(`[Regen] ${protocol.injectablePeptides?.length || 0} injectables, ${protocol.supplements?.length || 0} supplements`);
  console.log(`[Regen] ${protocol.bioregulators?.length || 0} bioregulators, ${protocol.oralPeptides?.length || 0} oral peptides`);

  console.log("[Regen] Running deterministic QA checks...");
  const qa = runDeterministicQAChecks(protocol, profile);
  console.log(`[Regen] QA: ${qa.issues.length} issues, ${qa.suggestions.length} suggestions, catalog match: ${(qa.catalogMatchRate * 100).toFixed(0)}%`);
  if (qa.issues.length > 0) {
    for (const issue of qa.issues) {
      console.error(`[Regen] QA FAIL: ${issue}`);
    }
    const skipQA = process.env.SKIP_QA_GATE === "true";
    if (skipQA) {
      console.warn(`[Regen] SKIP_QA_GATE=true — proceeding despite ${qa.issues.length} issue(s)`);
    } else {
      console.error(`[Regen] QA HARD FAIL: ${qa.issues.length} deterministic issue(s) found. Set SKIP_QA_GATE=true to override.`);
      process.exit(1);
    }
  } else {
    console.log("[Regen] All QA checks passed");
  }

  console.log("[Regen] Generating Full Protocol PDF...");
  const fullPdf = await generateProtocolPDFBuffer(protocol, profile);
  const fullPath = path.join(OUTPUT_DIR, "Kathryn_Smith_Full_Protocol.pdf");
  fs.writeFileSync(fullPath, fullPdf);
  console.log(`[Regen] Full Protocol: ${(fullPdf.length / 1024).toFixed(0)} KB`);

  console.log("[Regen] Generating Daily Schedule PDF...");
  const dailyPdf = await generateDailySchedulePDFBuffer(protocol, profile);
  const dailyPath = path.join(OUTPUT_DIR, "Kathryn_Smith_Daily_Schedule.pdf");
  fs.writeFileSync(dailyPath, dailyPdf);
  console.log(`[Regen] Daily Schedule: ${(dailyPdf.length / 1024).toFixed(0)} KB`);

  console.log("[Regen] Generating Peptide Schedule PDF...");
  const peptidePdf = await generatePeptideSchedulePDFBuffer(protocol, profile);
  const peptidePath = path.join(OUTPUT_DIR, "Kathryn_Smith_Peptide_Schedule.pdf");
  fs.writeFileSync(peptidePath, peptidePdf);
  console.log(`[Regen] Peptide Schedule: ${(peptidePdf.length / 1024).toFixed(0)} KB`);

  console.log("[Regen] Generating Protocol PPTX Presentation...");
  const pptxBuffer = await generateProtocolPPTX(protocol, profile);
  const pptxPath = path.join(OUTPUT_DIR, "Kathryn_Smith_Protocol_Presentation.pptx");
  fs.writeFileSync(pptxPath, pptxBuffer);
  console.log(`[Regen] PPTX: ${(pptxBuffer.length / 1024).toFixed(0)} KB`);

  console.log(`\n[Regen] All 4 deliverables generated for record id=${id}!`);
  console.log(`  Full Protocol:     ${fullPath}`);
  console.log(`  Daily Schedule:    ${dailyPath}`);
  console.log(`  Peptide Schedule:  ${peptidePath}`);
  console.log(`  PPTX Presentation: ${pptxPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[Regen] Fatal:", err);
  process.exit(1);
});
