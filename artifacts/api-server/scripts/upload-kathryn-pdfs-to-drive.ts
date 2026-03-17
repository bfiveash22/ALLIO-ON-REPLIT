import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import {
  findAllioFolder,
  createSubfolder,
  uploadFileFromPath,
  findFolderByName,
} from "../src/services/drive";

const MEMBER_NAME = "Kathryn Smith";
const OUTPUT_DIR = path.resolve(process.cwd(), "..", "..", "public", "protocols");

const DELIVERABLE_FILES = [
  { fileName: "Kathryn_Smith_Full_Protocol.pdf", dbField: "pdfDriveFileId" as const, dbLinkField: "pdfDriveWebViewLink" as const },
  { fileName: "Kathryn_Smith_Daily_Schedule.pdf", dbField: "dailySchedulePdfFileId" as const, dbLinkField: "dailySchedulePdfWebViewLink" as const },
  { fileName: "Kathryn_Smith_Peptide_Schedule.pdf", dbField: "peptideSchedulePdfFileId" as const, dbLinkField: "peptideSchedulePdfWebViewLink" as const },
  { fileName: "Kathryn_Smith_Protocol_Presentation.pptx", dbField: "slidesPresentationId" as const, dbLinkField: "slidesWebViewLink" as const },
];

async function resolveTargetId(): Promise<number> {
  const records = await db
    .select({ id: generatedProtocols.id })
    .from(generatedProtocols)
    .where(eq(generatedProtocols.patientName, MEMBER_NAME))
    .orderBy(desc(generatedProtocols.createdAt))
    .limit(1);

  if (!records.length) {
    throw new Error(`No protocol record found for member "${MEMBER_NAME}"`);
  }
  return records[0].id;
}

async function ensureMemberFolder(): Promise<string> {
  const allioFolder = await findAllioFolder();
  if (!allioFolder) throw new Error("ALLIO folder not found on Drive");

  let memberContentId = await findFolderByName(allioFolder.id, "Member Content");
  if (!memberContentId) {
    const folder = await createSubfolder(allioFolder.id, "Member Content");
    memberContentId = folder.id;
  }

  let protocolsId = await findFolderByName(memberContentId, "Protocols");
  if (!protocolsId) {
    const folder = await createSubfolder(memberContentId, "Protocols");
    protocolsId = folder.id;
  }

  let memberFolderId = await findFolderByName(protocolsId, MEMBER_NAME);
  if (!memberFolderId) {
    const folder = await createSubfolder(protocolsId, MEMBER_NAME);
    memberFolderId = folder.id;
  }

  return memberFolderId;
}

async function main() {
  const targetId = await resolveTargetId();
  console.log(`[Upload] Resolved target protocol record: id=${targetId} for "${MEMBER_NAME}"`);

  const memberFolderId = await ensureMemberFolder();
  console.log(`[Upload] Member folder resolved: ${memberFolderId}`);

  for (const file of DELIVERABLE_FILES) {
    const filePath = path.join(OUTPUT_DIR, file.fileName);
    if (!fs.existsSync(filePath)) {
      console.error(`[Upload] File not found: ${filePath} — skipping`);
      continue;
    }

    const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(0);
    console.log(`[Upload] Uploading ${file.fileName} (${sizeKB} KB)...`);

    const result = await uploadFileFromPath(memberFolderId, filePath, file.fileName);
    if (result) {
      console.log(`[Upload] OK: ${result.webViewLink}`);
      await db.update(generatedProtocols)
        .set({
          [file.dbField]: result.id,
          [file.dbLinkField]: result.webViewLink || null,
        })
        .where(eq(generatedProtocols.id, targetId));
      console.log(`[Upload] DB updated: id=${targetId} ${file.dbField}=${result.id}`);
    } else {
      console.error(`[Upload] FAILED: ${file.fileName}`);
    }
  }

  console.log(`\n[Upload] All deliverables uploaded to Drive member folder and DB record id=${targetId} updated!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Upload] Fatal:", err);
  process.exit(1);
});
