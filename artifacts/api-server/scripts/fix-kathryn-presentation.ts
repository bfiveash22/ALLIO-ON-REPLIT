import * as fs from "fs";
import * as path from "path";
import { deleteDriveFile, uploadProtocolToDrive, getUncachableGoogleDriveClient } from "../src/services/drive";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq } from "drizzle-orm";

const BAD_SLIDES_ID = "1NyjPJFaTtRX1ydpWPwLbC7mZFihIuvpoU4FSho4rt6s";
const KATHRYN_MEMBER_ID = "kathryn-smith-2026";
const DRIVE_FOLDER_ID = "1ui5cbRdyVhIojeG44EYg17puOdt4bStH";
const WORKSPACE_ROOT = path.resolve(process.cwd(), "..", "..");
const PDF_PATH = path.join(WORKSPACE_ROOT, "public", "protocols", "Kathryn_Smith_Protocol_Presentation.pdf");
const DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN || "";
const WEB_PRESENTATION_URL = `https://${DEV_DOMAIN}/protocol-presentation/`;

export async function fixKathrynPresentation(options?: {
  skipDelete?: boolean;
  skipCleanup?: boolean;
  pdfPath?: string;
}) {
  const opts = options || {};
  const pdfFilePath = opts.pdfPath || PDF_PATH;

  if (!opts.skipDelete) {
    console.log("[Fix] Step 1: Delete bad Google Slides presentation...");
    const deleted = await deleteDriveFile(BAD_SLIDES_ID);
    if (deleted) {
      console.log(`[Fix] Deleted bad Google Slides: ${BAD_SLIDES_ID}`);
    } else {
      console.log(`[Fix] Could not delete Google Slides ${BAD_SLIDES_ID} (may already be deleted)`);
    }
  }

  if (!opts.skipCleanup) {
    console.log("[Fix] Step 2: Listing existing Kathryn files in Drive folder for cleanup...");
    try {
      const drive = await getUncachableGoogleDriveClient();
      const listRes = await drive.files.list({
        q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
        fields: "files(id, name, createdTime, mimeType)",
        orderBy: "createdTime desc",
      });
      const files = listRes.data.files || [];
      console.log(`[Fix] Found ${files.length} files in ALLIO folder`);

      const kathrynFiles = files.filter(f =>
        f.name?.toLowerCase().includes("kathryn") ||
        f.name?.toLowerCase().includes("smith")
      );

      const pdfFiles = kathrynFiles.filter(f =>
        f.name?.endsWith(".pdf") &&
        !f.name?.includes("Presentation")
      );

      const grouped: Record<string, typeof pdfFiles> = {};
      for (const f of pdfFiles) {
        const baseName = f.name?.replace(/_\d{4}-\d{2}-\d{2}\.pdf$/, "") || "unknown";
        if (!grouped[baseName]) grouped[baseName] = [];
        grouped[baseName].push(f);
      }

      for (const [, groupFiles] of Object.entries(grouped)) {
        if (groupFiles.length > 1) {
          const sorted = groupFiles.sort((a, b) =>
            new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime()
          );
          const dupes = sorted.slice(1);
          for (const dupe of dupes) {
            console.log(`[Fix] Deleting older duplicate: ${dupe.name} (${dupe.id})`);
            await deleteDriveFile(dupe.id!);
          }
        }
      }
    } catch (err) {
      console.warn("[Fix] Could not list/clean Drive files:", err);
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

  if (!uploadResult.success) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadResult)}`);
  }

  console.log(`[Fix] Uploaded to Drive: ${uploadResult.webViewLink}`);
  console.log(`[Fix] File ID: ${uploadResult.fileId}`);

  console.log("[Fix] Step 4: Update DB records (id=1 and id=2)...");
  const targetIds = [1, 2];
  let updatedCount = 0;

  for (const targetId of targetIds) {
    const [existing] = await db
      .select()
      .from(generatedProtocols)
      .where(
        eq(generatedProtocols.id, targetId)
      )
      .limit(1);

    if (!existing || existing.memberId !== KATHRYN_MEMBER_ID) {
      console.warn(`[Fix] Record id=${targetId} not found or not Kathryn's — skipping`);
      continue;
    }

    const existingNotes = existing.notes || "";
    const webUrlNote = `Interactive presentation: ${WEB_PRESENTATION_URL}`;
    const driveNote = `Drive PDF: ${uploadResult.webViewLink}`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n${webUrlNote}\n${driveNote}`
      : `${webUrlNote}\n${driveNote}`;

    await db
      .update(generatedProtocols)
      .set({
        slidesPresentationId: uploadResult.fileId || null,
        slidesWebViewLink: WEB_PRESENTATION_URL,
        notes: updatedNotes,
      })
      .where(eq(generatedProtocols.id, targetId));
    console.log(`[Fix] Updated record id=${targetId}: slidesPresentationId=${uploadResult.fileId}, slidesWebViewLink=${WEB_PRESENTATION_URL}`);
    updatedCount++;
  }

  if (updatedCount === 0) {
    throw new Error("No Kathryn records updated — expected to update id=1 and id=2");
  }

  const summary = {
    presentationDrivePdfLink: uploadResult.webViewLink,
    presentationFileId: uploadResult.fileId,
    webPresentationUrl: WEB_PRESENTATION_URL,
    dbRecordsUpdated: updatedCount,
  };

  console.log("\n[Fix] Summary:", JSON.stringify(summary, null, 2));
  return summary;
}

const isMainModule = process.argv[1]?.includes("fix-kathryn-presentation");
if (isMainModule) {
  fixKathrynPresentation({ skipDelete: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Fix] Fatal error:", err);
      process.exit(1);
    });
}
