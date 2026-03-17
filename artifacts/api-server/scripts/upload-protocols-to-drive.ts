import * as fs from 'fs';
import * as path from 'path';
import {
  findAllioFolder,
  createSubfolder,
  uploadFileFromPath,
  findFolderByName,
} from '../src/services/drive';

const PROTOCOLS_DIR = path.join(process.cwd(), 'generated-protocols');

const MEMBER_FILES: Record<string, string[]> = {
  'Kathryn Smith': [
    'Kathryn_Smith_Full_Protocol.pdf',
    'Kathryn_Smith_Peptide_Schedule.pdf',
    'Kathryn_Smith_Daily_Schedule.pdf',
    'Kathryn_Smith_Protocol_Presentation.pptx',
  ],
  'Annette Gomer': [
    'Annette_Gomer_Full_Protocol.pdf',
    'Annette_Gomer_Peptide_Schedule.pdf',
    'Annette_Gomer_Daily_Schedule.pdf',
    'Annette_Gomer_Protocol_Presentation.pptx',
  ],
  'John D (Crop Duster)': [
    'Crop_Duster_80M_Full_Protocol.pdf',
    'Crop_Duster_80M_Peptide_Schedule.pdf',
    'Crop_Duster_80M_Daily_Schedule.pdf',
    'Crop_Duster_80M_Protocol_Presentation.pptx',
  ],
  'Margaret R (Breast Cancer)': [
    'Breast_Cancer_75F_Full_Protocol.pdf',
    'Breast_Cancer_75F_Peptide_Schedule.pdf',
    'Breast_Cancer_75F_Daily_Schedule.pdf',
    'Breast_Cancer_75F_Protocol_Presentation.pptx',
  ],
};

async function main() {
  console.log('[Upload] Starting protocol upload to Google Drive...');

  const allioFolder = await findAllioFolder();
  if (!allioFolder) {
    console.error('[Upload] ALLIO folder not found');
    process.exit(1);
  }
  console.log(`[Upload] ALLIO folder: ${allioFolder.id}`);

  let memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
  if (!memberContentId) {
    const folder = await createSubfolder(allioFolder.id, 'Member Content');
    memberContentId = folder.id;
    console.log(`[Upload] Created "Member Content" folder: ${memberContentId}`);
  } else {
    console.log(`[Upload] Found "Member Content" folder: ${memberContentId}`);
  }

  let protocolsId = await findFolderByName(memberContentId, 'Protocols');
  if (!protocolsId) {
    const folder = await createSubfolder(memberContentId, 'Protocols');
    protocolsId = folder.id;
    console.log(`[Upload] Created "Protocols" subfolder: ${protocolsId}`);
  } else {
    console.log(`[Upload] Found "Protocols" subfolder: ${protocolsId}`);
  }

  let totalUploaded = 0;
  let totalFailed = 0;

  for (const [memberName, files] of Object.entries(MEMBER_FILES)) {
    console.log(`\n[Upload] Processing member: ${memberName}`);

    let memberFolderId = await findFolderByName(protocolsId, memberName);
    if (!memberFolderId) {
      const folder = await createSubfolder(protocolsId, memberName);
      memberFolderId = folder.id;
      console.log(`[Upload] Created member folder: ${memberName} (${memberFolderId})`);
    } else {
      console.log(`[Upload] Found member folder: ${memberName} (${memberFolderId})`);
    }

    for (const fileName of files) {
      const filePath = path.join(PROTOCOLS_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        console.error(`[Upload] File not found: ${filePath}`);
        totalFailed++;
        continue;
      }

      const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(0);
      console.log(`[Upload] Uploading ${fileName} (${sizeKB} KB)...`);

      try {
        const result = await uploadFileFromPath(memberFolderId, filePath, fileName);
        if (result) {
          console.log(`[Upload] OK: ${result.webViewLink}`);
          totalUploaded++;
        } else {
          console.error(`[Upload] FAILED: ${fileName}`);
          totalFailed++;
        }
      } catch (err) {
        console.error(`[Upload] ERROR uploading ${fileName}:`, err);
        totalFailed++;
      }
    }
  }

  const totalExpected = Object.values(MEMBER_FILES).flat().length;
  console.log(`\n[Upload] ═══════════════════════════════════════════`);
  console.log(`[Upload] VERIFICATION: ${totalUploaded}/${totalExpected} files uploaded, ${totalFailed} failed`);
  if (totalUploaded === totalExpected && totalFailed === 0) {
    console.log(`[Upload] ALL ${totalExpected} DELIVERABLES VERIFIED ✓`);
  } else {
    console.error(`[Upload] INCOMPLETE: expected ${totalExpected}, got ${totalUploaded} uploaded`);
    process.exit(1);
  }
  console.log(`[Upload] ═══════════════════════════════════════════`);
}

main().catch(err => {
  console.error('[Upload] Fatal error:', err);
  process.exit(1);
});
