import {
  findAllioFolder,
  createSubfolder,
  findFolderByName,
  listFolderContents,
  getUncachableGoogleDriveClient,
} from "../src/services/drive";

const LEGAL_COMPLIANCE_SUBFOLDERS = [
  "Constitutional Law",
  "Case Law",
  "Reference Materials",
  "PMA Formation Documents",
];

const MEMBER_CONTRACTS_FOLDER = "Member Contracts";

const CONTRACT_KEYWORDS = [
  "agreement", "contract", "consent", "signature", "signed",
  "onboarding", "intake", "enrollment", "member agreement",
  "nda", "waiver", "release",
];

const LEGAL_REFERENCE_KEYWORDS = [
  "law", "constitutional", "amendment", "statute", "regulation",
  "case", "ruling", "precedent", "legal guide", "reference",
  "first amendment", "fourteenth amendment", "pma law",
  "trademark", "patent", "ip ", "intellectual property",
  "compliance", "framework", "handbook",
];

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

interface AuditResult {
  path: string;
  parentFolderId: string;
  file: DriveFile;
  category: "contract" | "legal_reference" | "uncategorized";
  suggestedLocation: string;
}

function categorizeFile(name: string, path: string): "contract" | "legal_reference" | "uncategorized" {
  const lower = name.toLowerCase();
  const pathLower = path.toLowerCase();

  if (CONTRACT_KEYWORDS.some(k => lower.includes(k))) return "contract";
  if (pathLower.includes("contract")) return "contract";
  if (LEGAL_REFERENCE_KEYWORDS.some(k => lower.includes(k))) return "legal_reference";
  if (pathLower.includes("legal") || pathLower.includes("compliance")) return "legal_reference";
  return "uncategorized";
}

async function scanFolder(
  folderId: string,
  folderPath: string,
  results: AuditResult[],
  depth: number = 0,
): Promise<void> {
  if (depth > 5) return;

  const contents = await listFolderContents(folderId);

  for (const item of contents) {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      await scanFolder(item.id, `${folderPath}/${item.name}`, results, depth + 1);
    } else {
      const category = categorizeFile(item.name, folderPath);
      let suggestedLocation = folderPath;

      if (category === "contract") {
        suggestedLocation = `ALLIO/${MEMBER_CONTRACTS_FOLDER}/{MemberName}/`;
      } else if (category === "legal_reference") {
        if (item.name.toLowerCase().includes("constitutional") || item.name.toLowerCase().includes("amendment")) {
          suggestedLocation = "ALLIO/Legal Compliance/Constitutional Law/";
        } else if (item.name.toLowerCase().includes("case") || item.name.toLowerCase().includes("ruling")) {
          suggestedLocation = "ALLIO/Legal Compliance/Case Law/";
        } else {
          suggestedLocation = "ALLIO/Legal Compliance/Reference Materials/";
        }
      }

      results.push({ path: folderPath, parentFolderId: folderId, file: item, category, suggestedLocation });
    }
  }
}

async function ensureLegalFolderStructure(allioId: string): Promise<Record<string, string>> {
  const folderIds: Record<string, string> = {};

  let legalComplianceId = await findFolderByName(allioId, "Legal Compliance");
  if (!legalComplianceId) {
    const folder = await createSubfolder(allioId, "Legal Compliance");
    legalComplianceId = folder.id;
    console.log(`[Legal] Created "Legal Compliance" folder`);
  }
  folderIds["Legal Compliance"] = legalComplianceId;

  for (const subfolder of LEGAL_COMPLIANCE_SUBFOLDERS) {
    let subId = await findFolderByName(legalComplianceId, subfolder);
    if (!subId) {
      const folder = await createSubfolder(legalComplianceId, subfolder);
      subId = folder.id;
      console.log(`[Legal] Created "Legal Compliance/${subfolder}"`);
    }
    folderIds[`Legal Compliance/${subfolder}`] = subId;
  }

  let memberContractsId = await findFolderByName(allioId, MEMBER_CONTRACTS_FOLDER);
  if (!memberContractsId) {
    const folder = await createSubfolder(allioId, MEMBER_CONTRACTS_FOLDER);
    memberContractsId = folder.id;
    console.log(`[Legal] Created "${MEMBER_CONTRACTS_FOLDER}" folder`);
  }
  folderIds[MEMBER_CONTRACTS_FOLDER] = memberContractsId;

  return folderIds;
}

async function moveFile(fileId: string, currentParentId: string, newParentId: string): Promise<boolean> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    await drive.files.update({
      fileId,
      removeParents: currentParentId,
      addParents: newParentId,
      fields: "id, parents",
    });
    return true;
  } catch (err: any) {
    console.error(`[Legal] Failed to move file ${fileId}: ${err.message}`);
    return false;
  }
}

async function main() {
  const dryRun = !process.argv.includes("--execute");
  console.log(`\n[Legal Drive Audit] Mode: ${dryRun ? "DRY RUN (add --execute to apply)" : "EXECUTING CHANGES"}\n`);

  const allioFolder = await findAllioFolder();
  if (!allioFolder) {
    console.error("[Legal] ALLIO folder not found");
    process.exit(1);
  }

  console.log("[Legal] Phase 1: Ensuring folder structure...");
  const folderIds = await ensureLegalFolderStructure(allioFolder.id);
  console.log(`[Legal] Folder structure: ${Object.keys(folderIds).length} folders verified\n`);

  console.log("[Legal] Phase 2: Scanning Legal Compliance folder...");
  const legalId = folderIds["Legal Compliance"];
  const results: AuditResult[] = [];
  await scanFolder(legalId, "ALLIO/Legal Compliance", results);

  const legacyLegalId = await findFolderByName(allioFolder.id, "Legal - Contracts & Agreements");
  if (legacyLegalId) {
    console.log("[Legal] Found legacy 'Legal - Contracts & Agreements' folder, scanning...");
    await scanFolder(legacyLegalId, "ALLIO/Legal - Contracts & Agreements", results);
  }

  const contracts = results.filter(r => r.category === "contract");
  const references = results.filter(r => r.category === "legal_reference");
  const uncategorized = results.filter(r => r.category === "uncategorized");

  console.log(`\n[Legal] ═══════════════════════════════════════════`);
  console.log(`[Legal] AUDIT RESULTS`);
  console.log(`[Legal] ═══════════════════════════════════════════`);
  console.log(`[Legal] Total files scanned: ${results.length}`);
  console.log(`[Legal] Contracts found: ${contracts.length}`);
  console.log(`[Legal] Legal references: ${references.length}`);
  console.log(`[Legal] Uncategorized: ${uncategorized.length}`);

  if (contracts.length > 0) {
    console.log(`\n[Legal] --- CONTRACTS ---`);
    for (const c of contracts) {
      console.log(`  ${c.file.name}`);
      console.log(`    Current: ${c.path}`);
      console.log(`    Suggested: ${c.suggestedLocation}`);
    }
  }

  if (references.length > 0) {
    console.log(`\n[Legal] --- LEGAL REFERENCES ---`);
    for (const r of references) {
      console.log(`  ${r.file.name}`);
      console.log(`    Current: ${r.path}`);
      console.log(`    Suggested: ${r.suggestedLocation}`);
    }
  }

  if (uncategorized.length > 0) {
    console.log(`\n[Legal] --- UNCATEGORIZED ---`);
    for (const u of uncategorized) {
      console.log(`  ${u.file.name} (${u.path})`);
    }
  }

  console.log(`\n[Legal] Phase 3: Drive-wide misplaced file check...`);
  const allContents = await listFolderContents(allioFolder.id);
  const topLevelFolders = allContents.filter(f => f.mimeType === "application/vnd.google-apps.folder");
  const topLevelFiles = allContents.filter(f => f.mimeType !== "application/vnd.google-apps.folder");

  if (topLevelFiles.length > 0) {
    console.log(`[Legal] WARNING: ${topLevelFiles.length} files at ALLIO root level (should be in subfolders):`);
    for (const f of topLevelFiles) {
      console.log(`  - ${f.name} (${f.mimeType})`);
    }
  } else {
    console.log(`[Legal] ALLIO root level is clean (folders only)`);
  }

  console.log(`\n[Legal] Top-level folder structure:`);
  for (const folder of topLevelFolders) {
    console.log(`  📁 ${folder.name} (${folder.id})`);
  }

  console.log(`\n[Legal] ═══════════════════════════════════════════`);
  console.log(`[Legal] FOLDER STRUCTURE VERIFIED`);
  console.log(`[Legal] ═══════════════════════════════════════════`);
  for (const [name, id] of Object.entries(folderIds)) {
    console.log(`  ${name}: ${id}`);
  }

  if (!dryRun) {
    console.log(`\n[Legal] Phase 4: Executing file reorganization...`);
    let moved = 0;
    let failed = 0;

    for (const c of contracts) {
      const targetFolderId = folderIds[MEMBER_CONTRACTS_FOLDER];
      if (targetFolderId && c.path !== `ALLIO/${MEMBER_CONTRACTS_FOLDER}`) {
        console.log(`[Legal] Moving "${c.file.name}" from ${c.path} → ${MEMBER_CONTRACTS_FOLDER}/`);
        const ok = await moveFile(c.file.id, c.parentFolderId, targetFolderId);
        if (ok) moved++;
        else failed++;
      }
    }

    for (const r of references) {
      let targetKey = "Legal Compliance/Reference Materials";
      const nameLower = r.file.name.toLowerCase();
      if (nameLower.includes("constitutional") || nameLower.includes("amendment")) {
        targetKey = "Legal Compliance/Constitutional Law";
      } else if (nameLower.includes("case") || nameLower.includes("ruling") || nameLower.includes("precedent")) {
        targetKey = "Legal Compliance/Case Law";
      }
      const targetFolderId = folderIds[targetKey];
      if (targetFolderId && !r.path.includes(targetKey)) {
        console.log(`[Legal] Moving "${r.file.name}" from ${r.path} → ${targetKey}/`);
        const ok = await moveFile(r.file.id, r.parentFolderId, targetFolderId);
        if (ok) moved++;
        else failed++;
      }
    }

    console.log(`[Legal] Reorganization complete: ${moved} moved, ${failed} failed`);
  }

  console.log(`\n[Legal] Audit complete.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Legal] Fatal:", err);
  process.exit(1);
});
