import * as fs from "fs";
import * as path from "path";
import { deleteDriveFile, uploadProtocolToDrive, getUncachableGoogleDriveClient } from "../src/services/drive";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const BAD_SLIDES_ID = "1NyjPJFaTtRX1ydpWPwLbC7mZFihIuvpoU4FSho4rt6s";
const KATHRYN_MEMBER_ID = "kathryn-smith-2026";
const PRIMARY_RECORD_ID = 2;
const ALLIO_FOLDER_ID = "1ui5cbRdyVhIojeG44EYg17puOdt4bStH";
const WORKSPACE_ROOT = path.resolve(process.cwd(), "..", "..");
const PDF_PATH = path.join(WORKSPACE_ROOT, "public", "protocols", "Kathryn_Smith_Protocol_Presentation.pdf");
const PRODUCTION_PRESENTATION_URL = "https://www.ffpma.com/protocol-presentation/";

export async function fixKathrynPresentation(options?: {
  skipCleanup?: boolean;
  pdfPath?: string;
}) {
  const opts = options || {};
  const pdfFilePath = opts.pdfPath || PDF_PATH;

  console.log("[Fix] Step 1: Delete bad Google Slides presentation...");
  const deleted = await deleteDriveFile(BAD_SLIDES_ID);
  if (deleted) {
    console.log(`[Fix] Deleted bad Google Slides: ${BAD_SLIDES_ID}`);
  } else {
    console.log(`[Fix] Google Slides ${BAD_SLIDES_ID} already deleted or not found`);
  }

  if (!opts.skipCleanup) {
    console.log("[Fix] Step 2: Cleaning up duplicate Kathryn files in Drive...");
    try {
      const drive = await getUncachableGoogleDriveClient();
      const listRes = await drive.files.list({
        q: `'${ALLIO_FOLDER_ID}' in parents and trashed = false`,
        fields: "files(id, name, createdTime, mimeType)",
        orderBy: "createdTime desc",
      });
      const files = listRes.data.files || [];
      console.log(`[Fix] Found ${files.length} files in ALLIO folder`);

      const kathrynPdfs = files.filter(f =>
        (f.name?.toLowerCase().includes("kathryn") || f.name?.toLowerCase().includes("smith")) &&
        f.name?.endsWith(".pdf") &&
        !f.name?.includes("Presentation")
      );

      const grouped: Record<string, typeof kathrynPdfs> = {};
      for (const f of kathrynPdfs) {
        const baseName = f.name?.replace(/_\d{4}-\d{2}-\d{2}\.pdf$/, "") || "unknown";
        if (!grouped[baseName]) grouped[baseName] = [];
        grouped[baseName].push(f);
      }

      for (const [, groupFiles] of Object.entries(grouped)) {
        if (groupFiles.length > 1) {
          const sorted = groupFiles.sort((a, b) =>
            new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime()
          );
          for (const dupe of sorted.slice(1)) {
            console.log(`[Fix] Deleting older duplicate: ${dupe.name} (${dupe.id})`);
            await deleteDriveFile(dupe.id!);
          }
        }
      }
    } catch (err) {
      console.warn("[Fix] Could not clean Drive files:", err);
    }
  }

  console.log("[Fix] Step 3: Upload presentation PDF to Drive...");
  if (!fs.existsSync(pdfFilePath)) {
    throw new Error(`PDF not found at ${pdfFilePath}`);
  }

  const pdfBuffer = fs.readFileSync(pdfFilePath);
  console.log(`[Fix] PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  const uploadResult = await uploadProtocolToDrive(
    pdfBuffer,
    "Kathryn_Smith_Protocol_Presentation.pdf"
  );

  if (!uploadResult.success || !uploadResult.fileId) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadResult)}`);
  }

  const drive = await getUncachableGoogleDriveClient();
  const fileInfo = await drive.files.get({
    fileId: uploadResult.fileId,
    fields: "id, parents",
  });
  const parents = fileInfo.data.parents || [];
  console.log(`[Fix] Uploaded file ${uploadResult.fileId} to folder(s): ${parents.join(", ")}`);
  console.log(`[Fix] Drive PDF link: ${uploadResult.webViewLink}`);

  console.log(`[Fix] Step 4: Update DB record id=${PRIMARY_RECORD_ID} (member_id=${KATHRYN_MEMBER_ID})...`);

  const [targetRecord] = await db
    .select()
    .from(generatedProtocols)
    .where(
      and(
        eq(generatedProtocols.id, PRIMARY_RECORD_ID),
        eq(generatedProtocols.memberId, KATHRYN_MEMBER_ID)
      )
    )
    .limit(1);

  if (!targetRecord) {
    throw new Error(`Record id=${PRIMARY_RECORD_ID} with member_id=${KATHRYN_MEMBER_ID} not found`);
  }

  await db
    .update(generatedProtocols)
    .set({
      slidesPresentationId: uploadResult.fileId,
      slidesWebViewLink: PRODUCTION_PRESENTATION_URL,
      pdfDriveFileId: uploadResult.fileId,
      pdfDriveWebViewLink: uploadResult.webViewLink || null,
      notes: `Interactive presentation: ${PRODUCTION_PRESENTATION_URL}\nDrive PDF: ${uploadResult.webViewLink}`,
    })
    .where(eq(generatedProtocols.id, PRIMARY_RECORD_ID));

  const [verified] = await db
    .select({
      id: generatedProtocols.id,
      slidesPresentationId: generatedProtocols.slidesPresentationId,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
    })
    .from(generatedProtocols)
    .where(eq(generatedProtocols.id, PRIMARY_RECORD_ID))
    .limit(1);

  if (verified.slidesPresentationId !== uploadResult.fileId) {
    throw new Error(`Verification failed: slidesPresentationId mismatch`);
  }
  if (verified.slidesWebViewLink !== PRODUCTION_PRESENTATION_URL) {
    throw new Error(`Verification failed: slidesWebViewLink mismatch`);
  }
  if (verified.pdfDriveFileId !== uploadResult.fileId) {
    throw new Error(`Verification failed: pdfDriveFileId mismatch`);
  }
  if (verified.pdfDriveWebViewLink !== uploadResult.webViewLink) {
    throw new Error(`Verification failed: pdfDriveWebViewLink mismatch`);
  }

  console.log(`[Fix] Verified record id=${PRIMARY_RECORD_ID}:`);
  console.log(`  slidesPresentationId = ${verified.slidesPresentationId}`);
  console.log(`  slidesWebViewLink = ${verified.slidesWebViewLink}`);
  console.log(`  pdfDriveFileId = ${verified.pdfDriveFileId}`);
  console.log(`  pdfDriveWebViewLink = ${verified.pdfDriveWebViewLink}`);

  const summary = {
    badSlidesDeleted: BAD_SLIDES_ID,
    drivePdfLink: uploadResult.webViewLink,
    driveFileId: uploadResult.fileId,
    productionPresentationUrl: PRODUCTION_PRESENTATION_URL,
    primaryRecordUpdated: PRIMARY_RECORD_ID,
  };

  console.log("\n[Fix] Summary:", JSON.stringify(summary, null, 2));
  return summary;
}

const isMainModule = process.argv[1]?.includes("fix-kathryn-presentation");
if (isMainModule) {
  fixKathrynPresentation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Fix] Fatal error:", err);
      process.exit(1);
    });
}
