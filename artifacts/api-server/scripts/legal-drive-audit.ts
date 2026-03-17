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

const KNOWN_MEMBERS = [
  "Kathryn Smith",
  "Annette Gomer",
  "John D.",
  "Margaret R.",
];

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

const EXPECTED_DIVISION_FOLDERS = [
  "Executive", "Legal", "Financial", "Marketing", "Science", "Engineering", "Support",
];

const EXPECTED_TOP_LEVEL = new Set([
  "02_DIVISIONS", "Legal Compliance", "Member Contracts", "Member Content",
  "Protocols", "Agent_Libraries", "Brand Assets", "Agent Collaboration",
  "Science Research", "Legal Documents", "Marketing Assets", "Learning Modules",
  "Blood Analysis Upgrade",
  "Legal - Contracts & Agreements",
  "ATLAS - Financial Reports", "HERMES - Drive Organization",
  "ATHENA - Communications", "AURORA - Frequency Research",
  "PIXEL - Design Assets", "FORGE - Production", "PRISM - Videos",
]);

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
  memberName?: string;
}

function extractMemberName(filename: string): string | null {
  const lower = filename.toLowerCase().replace(/[_-]/g, " ");
  for (const member of KNOWN_MEMBERS) {
    if (lower.includes(member.toLowerCase())) return member;
  }
  const namePattern = /^([a-z]+[_ ]?[a-z]+)[_ ](agreement|contract|consent|waiver|nda|intake)/i;
  const match = filename.match(namePattern);
  if (match) {
    return match[1].replace(/[_]/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  return null;
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
      let memberName: string | null = null;

      if (category === "contract") {
        memberName = extractMemberName(item.name);
        suggestedLocation = memberName
          ? `ALLIO/${MEMBER_CONTRACTS_FOLDER}/${memberName}/`
          : `ALLIO/${MEMBER_CONTRACTS_FOLDER}/Unassigned/`;
      } else if (category === "legal_reference") {
        if (item.name.toLowerCase().includes("constitutional") || item.name.toLowerCase().includes("amendment")) {
          suggestedLocation = "ALLIO/Legal Compliance/Constitutional Law/";
        } else if (item.name.toLowerCase().includes("case") || item.name.toLowerCase().includes("ruling")) {
          suggestedLocation = "ALLIO/Legal Compliance/Case Law/";
        } else {
          suggestedLocation = "ALLIO/Legal Compliance/Reference Materials/";
        }
      }

      results.push({
        path: folderPath,
        parentFolderId: folderId,
        file: item,
        category,
        suggestedLocation,
        memberName: memberName || undefined,
      });
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

  for (const member of KNOWN_MEMBERS) {
    let memberId = await findFolderByName(memberContractsId, member);
    if (!memberId) {
      const folder = await createSubfolder(memberContractsId, member);
      memberId = folder.id;
      console.log(`[Legal] Created "${MEMBER_CONTRACTS_FOLDER}/${member}"`);
    }
    folderIds[`${MEMBER_CONTRACTS_FOLDER}/${member}`] = memberId;
  }

  let unassignedId = await findFolderByName(memberContractsId, "Unassigned");
  if (!unassignedId) {
    const folder = await createSubfolder(memberContractsId, "Unassigned");
    unassignedId = folder.id;
    console.log(`[Legal] Created "${MEMBER_CONTRACTS_FOLDER}/Unassigned"`);
  }
  folderIds[`${MEMBER_CONTRACTS_FOLDER}/Unassigned`] = unassignedId;

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

interface DriveWideIssue {
  type: "misplaced_file" | "duplicate_folder" | "unknown_folder" | "empty_folder";
  path: string;
  file?: DriveFile;
  detail: string;
}

async function driveWideCleanupAudit(allioId: string): Promise<DriveWideIssue[]> {
  const issues: DriveWideIssue[] = [];

  const allContents = await listFolderContents(allioId);
  const topLevelFolders = allContents.filter(f => f.mimeType === "application/vnd.google-apps.folder");
  const topLevelFiles = allContents.filter(f => f.mimeType !== "application/vnd.google-apps.folder");

  for (const f of topLevelFiles) {
    issues.push({
      type: "misplaced_file",
      path: "ALLIO/",
      file: f,
      detail: `File "${f.name}" is at ALLIO root level (should be in a subfolder)`,
    });
  }

  const folderNameCounts = new Map<string, number>();
  for (const folder of topLevelFolders) {
    const count = (folderNameCounts.get(folder.name) || 0) + 1;
    folderNameCounts.set(folder.name, count);
  }
  for (const [name, count] of folderNameCounts) {
    if (count > 1) {
      issues.push({
        type: "duplicate_folder",
        path: `ALLIO/${name}`,
        detail: `Folder "${name}" appears ${count} times at ALLIO root level (should be consolidated)`,
      });
    }
  }

  for (const folder of topLevelFolders) {
    if (!EXPECTED_TOP_LEVEL.has(folder.name) && folderNameCounts.get(folder.name) === 1) {
      issues.push({
        type: "unknown_folder",
        path: `ALLIO/${folder.name}`,
        detail: `Unknown folder "${folder.name}" not in expected ALLIO structure`,
      });
    }
  }

  for (const divName of EXPECTED_DIVISION_FOLDERS) {
    const divFolders = topLevelFolders.filter(f => f.name === divName);
    if (divFolders.length === 0) {
      console.log(`[Cleanup] Division folder "${divName}" not found at top level (may be in 02_DIVISIONS)`);
    }
  }

  const divisionsFolders = topLevelFolders.filter(f => f.name === "02_DIVISIONS");
  if (divisionsFolders.length > 0) {
    for (const divFolder of divisionsFolders) {
      const divContents = await listFolderContents(divFolder.id);
      const divFiles = divContents.filter(f => f.mimeType !== "application/vnd.google-apps.folder");
      for (const f of divFiles) {
        issues.push({
          type: "misplaced_file",
          path: `ALLIO/02_DIVISIONS/`,
          file: f,
          detail: `File "${f.name}" is directly in 02_DIVISIONS (should be in a division subfolder)`,
        });
      }

      const divSubfolders = divContents.filter(f => f.mimeType === "application/vnd.google-apps.folder");
      for (const divSub of divSubfolders) {
        const agentContents = await listFolderContents(divSub.id);
        const agentFiles = agentContents.filter(f => f.mimeType !== "application/vnd.google-apps.folder");
        for (const f of agentFiles) {
          issues.push({
            type: "misplaced_file",
            path: `ALLIO/02_DIVISIONS/${divSub.name}/`,
            file: f,
            detail: `File "${f.name}" is directly in division "${divSub.name}" (should be in agent/output subfolder)`,
          });
        }
      }
    }
  }

  return issues;
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

  const legalDocsId = await findFolderByName(allioFolder.id, "Legal Documents");
  if (legalDocsId) {
    console.log("[Legal] Found 'Legal Documents' folder, scanning...");
    await scanFolder(legalDocsId, "ALLIO/Legal Documents", results);
  }

  const contracts = results.filter(r => r.category === "contract");
  const references = results.filter(r => r.category === "legal_reference");
  const uncategorized = results.filter(r => r.category === "uncategorized");

  console.log(`\n[Legal] ═══════════════════════════════════════════`);
  console.log(`[Legal] LEGAL FILE AUDIT RESULTS`);
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
      console.log(`    Member: ${c.memberName || "Unassigned"}`);
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

  console.log(`\n[Legal] Phase 3: Drive-wide cleanup audit...`);
  const driveIssues = await driveWideCleanupAudit(allioFolder.id);

  const misplaced = driveIssues.filter(i => i.type === "misplaced_file");
  const duplicates = driveIssues.filter(i => i.type === "duplicate_folder");
  const unknowns = driveIssues.filter(i => i.type === "unknown_folder");

  console.log(`\n[Legal] ═══════════════════════════════════════════`);
  console.log(`[Legal] DRIVE-WIDE CLEANUP RESULTS`);
  console.log(`[Legal] ═══════════════════════════════════════════`);
  console.log(`[Legal] Total issues: ${driveIssues.length}`);
  console.log(`[Legal] Misplaced files: ${misplaced.length}`);
  console.log(`[Legal] Duplicate folders: ${duplicates.length}`);
  console.log(`[Legal] Unknown folders: ${unknowns.length}`);

  if (misplaced.length > 0) {
    console.log(`\n[Legal] --- MISPLACED FILES ---`);
    for (const m of misplaced) {
      console.log(`  ${m.detail}`);
    }
  }

  if (duplicates.length > 0) {
    console.log(`\n[Legal] --- DUPLICATE FOLDERS ---`);
    for (const d of duplicates) {
      console.log(`  ${d.detail}`);
    }
  }

  if (unknowns.length > 0) {
    console.log(`\n[Legal] --- UNKNOWN FOLDERS ---`);
    for (const u of unknowns) {
      console.log(`  ${u.detail}`);
    }
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
      const memberKey = c.memberName
        ? `${MEMBER_CONTRACTS_FOLDER}/${c.memberName}`
        : `${MEMBER_CONTRACTS_FOLDER}/Unassigned`;
      const targetFolderId = folderIds[memberKey];
      if (targetFolderId && !c.path.includes(memberKey)) {
        console.log(`[Legal] Moving "${c.file.name}" from ${c.path} → ${memberKey}/`);
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
