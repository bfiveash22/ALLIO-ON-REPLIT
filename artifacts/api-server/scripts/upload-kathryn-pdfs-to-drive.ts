import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq } from "drizzle-orm";
import { uploadProtocolToDrive } from "../src/services/drive";

const MEMBER_NAME = "Kathryn Smith";
const OUTPUT_DIR = path.resolve(process.cwd(), "..", "..", "public", "protocols");

async function resolveTargetId(): Promise<number> {
  const records = await db
    .select({ id: generatedProtocols.id })
    .from(generatedProtocols)
    .where(eq(generatedProtocols.patientName, MEMBER_NAME))
    .limit(1);

  if (!records.length) {
    throw new Error(`No protocol record found for member "${MEMBER_NAME}"`);
  }
  return records[0].id;
}

async function main() {
  const targetId = await resolveTargetId();
  console.log(`[Upload] Resolved target protocol record: id=${targetId} for "${MEMBER_NAME}"`);

  const fullPath = path.join(OUTPUT_DIR, "Kathryn_Smith_Full_Protocol.pdf");
  const dailyPath = path.join(OUTPUT_DIR, "Kathryn_Smith_Daily_Schedule.pdf");
  const peptidePath = path.join(OUTPUT_DIR, "Kathryn_Smith_Peptide_Schedule.pdf");
  const pptxPath = path.join(OUTPUT_DIR, "Kathryn_Smith_Protocol_Presentation.pptx");

  for (const p of [fullPath, dailyPath, peptidePath, pptxPath]) {
    if (!fs.existsSync(p)) {
      throw new Error(`File not found: ${p}`);
    }
  }

  console.log("[Upload] Uploading Full Protocol PDF to Drive...");
  const fullBuf = fs.readFileSync(fullPath);
  const fullResult = await uploadProtocolToDrive(fullBuf, "Kathryn_Smith_Full_Protocol_2026.pdf");
  console.log("[Upload] Full Protocol:", JSON.stringify(fullResult));

  if (fullResult.success && fullResult.fileId) {
    await db.update(generatedProtocols)
      .set({
        pdfDriveFileId: fullResult.fileId,
        pdfDriveWebViewLink: fullResult.webViewLink || null,
      })
      .where(eq(generatedProtocols.id, targetId));
    console.log(`[Upload] DB updated: id=${targetId} pdfDriveFileId=${fullResult.fileId}`);
  }

  console.log("[Upload] Uploading Daily Schedule PDF to Drive...");
  const dailyBuf = fs.readFileSync(dailyPath);
  const dailyResult = await uploadProtocolToDrive(dailyBuf, "Kathryn_Smith_Daily_Schedule_2026.pdf");
  console.log("[Upload] Daily Schedule:", JSON.stringify(dailyResult));

  if (dailyResult.success && dailyResult.fileId) {
    await db.update(generatedProtocols)
      .set({
        dailySchedulePdfFileId: dailyResult.fileId,
        dailySchedulePdfWebViewLink: dailyResult.webViewLink || null,
      })
      .where(eq(generatedProtocols.id, targetId));
    console.log(`[Upload] DB updated: id=${targetId} dailySchedulePdfFileId=${dailyResult.fileId}`);
  }

  console.log("[Upload] Uploading Peptide Schedule PDF to Drive...");
  const peptideBuf = fs.readFileSync(peptidePath);
  const peptideResult = await uploadProtocolToDrive(peptideBuf, "Kathryn_Smith_Peptide_Schedule_2026.pdf");
  console.log("[Upload] Peptide Schedule:", JSON.stringify(peptideResult));

  if (peptideResult.success && peptideResult.fileId) {
    await db.update(generatedProtocols)
      .set({
        peptideSchedulePdfFileId: peptideResult.fileId,
        peptideSchedulePdfWebViewLink: peptideResult.webViewLink || null,
      })
      .where(eq(generatedProtocols.id, targetId));
    console.log(`[Upload] DB updated: id=${targetId} peptideSchedulePdfFileId=${peptideResult.fileId}`);
  }

  console.log("[Upload] Uploading PPTX Presentation to Drive...");
  const pptxBuf = fs.readFileSync(pptxPath);
  const pptxResult = await uploadProtocolToDrive(
    pptxBuf,
    "Kathryn_Smith_Protocol_Presentation_2026.pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  );
  console.log("[Upload] PPTX:", JSON.stringify(pptxResult));

  if (pptxResult.success && pptxResult.fileId) {
    await db.update(generatedProtocols)
      .set({
        slidesPresentationId: pptxResult.fileId,
        slidesWebViewLink: pptxResult.webViewLink || null,
      })
      .where(eq(generatedProtocols.id, targetId));
    console.log(`[Upload] DB updated: id=${targetId} slidesPresentationId=${pptxResult.fileId}`);
  }

  console.log(`\n[Upload] All 4 deliverables uploaded to Drive and DB record id=${targetId} updated!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Upload] Fatal:", err);
  process.exit(1);
});
