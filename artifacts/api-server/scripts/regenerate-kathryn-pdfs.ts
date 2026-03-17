import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq } from "drizzle-orm";
import { buildKathrynSmithProfile } from "../src/services/kathryn-smith-protocol";
import {
  generateProtocolPDFBuffer,
  generateDailySchedulePDFBuffer,
  generatePeptideSchedulePDFBuffer,
} from "../src/services/protocol-assembly";
import { generateProtocolPPTX } from "../src/services/protocol-pptx";

const OUTPUT_DIR = path.resolve(process.cwd(), "..", "..", "public", "protocols");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("[Regen] Building Kathryn profile from timeline...");
  const profile = await buildKathrynSmithProfile();

  console.log("[Regen] Loading protocol data from DB...");
  const [record] = await db
    .select()
    .from(generatedProtocols)
    .where(eq(generatedProtocols.id, 2))
    .limit(1);

  if (!record || !record.protocol) {
    throw new Error("No protocol data found for record id=2");
  }

  const protocol = record.protocol as unknown as import("@shared/types/protocol-assembly").HealingProtocol;

  console.log(`[Regen] Protocol: ${protocol.patientName}, ${protocol.protocolDurationDays} days`);
  console.log(`[Regen] ${protocol.injectablePeptides?.length || 0} injectables, ${protocol.supplements?.length || 0} supplements`);
  console.log(`[Regen] ${protocol.bioregulators?.length || 0} bioregulators, ${protocol.oralPeptides?.length || 0} oral peptides`);

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

  console.log("\n[Regen] All 4 deliverables generated!");
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
