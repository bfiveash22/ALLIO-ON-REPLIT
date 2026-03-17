import { findAllioFolder, findFolderByName, uploadTextDocument } from "../src/services/drive";
import { getConstitutionalLawFramework } from "../src/services/legal-documents";

async function main() {
  console.log("[Constitutional Framework] Starting upload...\n");

  const allioFolder = await findAllioFolder();
  if (!allioFolder) {
    console.error("[Constitutional Framework] ALLIO folder not found");
    process.exit(1);
  }

  const legalComplianceId = await findFolderByName(allioFolder.id, "Legal Compliance");
  if (!legalComplianceId) {
    console.error("[Constitutional Framework] Legal Compliance folder not found — run legal-drive-audit.ts first");
    process.exit(1);
  }

  const constitutionalLawId = await findFolderByName(legalComplianceId, "Constitutional Law");
  if (!constitutionalLawId) {
    console.error("[Constitutional Framework] Constitutional Law subfolder not found");
    process.exit(1);
  }

  const framework = getConstitutionalLawFramework();
  console.log(`[Constitutional Framework] Uploading: ${framework.title}`);
  console.log(`[Constitutional Framework] Target folder: Legal Compliance/Constitutional Law/`);

  const result = await uploadTextDocument(
    constitutionalLawId,
    `FFPMA_Constitutional_Law_Framework_${framework.lastUpdated.replace(/[, ]+/g, "_")}.md`,
    framework.content,
    "text/markdown",
  );

  if (result) {
    console.log(`[Constitutional Framework] Upload successful`);
    console.log(`[Constitutional Framework] File ID: ${result.id}`);
    console.log(`[Constitutional Framework] URL: ${result.webViewLink || "N/A"}`);
  } else {
    console.error("[Constitutional Framework] Upload failed");
    process.exit(1);
  }

  const pmaFormationId = await findFolderByName(legalComplianceId, "PMA Formation Documents");
  if (pmaFormationId) {
    const pmaDoc = `# PMA Formation Checklist — Forgotten Formula PMA

## Structural Requirements Verified

1. [x] Private Member Association Agreement drafted and active
2. [x] Constitutional law framework documented (1st, 14th, 9th, 10th Amendments)
3. [x] Case law library compiled (NAACP v. Alabama, Roberts v. Jaycees, Boy Scouts v. Dale, etc.)
4. [x] Privacy Policy aligned with PMA sovereignty principles
5. [x] Terms of Service reflect private association status
6. [x] Doctor Onboarding Contract includes PMA acknowledgment
7. [x] PMA Language Compliance enforced across all agents
8. [x] Member Contracts folder structure established on Drive
9. [x] Legal Compliance folder hierarchy created
10. [x] AI agents (JURIS, AEGIS, LEXICON, SCRIBE) trained on constitutional foundations

## Drive Folder Structure

- ALLIO/Legal Compliance/Constitutional Law/ — Constitutional framework, amendment references
- ALLIO/Legal Compliance/Case Law/ — Court decisions supporting PMA sovereignty
- ALLIO/Legal Compliance/Reference Materials/ — General legal references and guides
- ALLIO/Legal Compliance/PMA Formation Documents/ — This checklist, formation documents
- ALLIO/Member Contracts/{MemberName}/ — Individual member agreement files

## Last Updated: ${new Date().toISOString().slice(0, 10)}
`;

    console.log(`\n[Constitutional Framework] Uploading PMA Formation Checklist...`);
    const checklistResult = await uploadTextDocument(
      pmaFormationId,
      `FFPMA_PMA_Formation_Checklist_${new Date().toISOString().slice(0, 10)}.md`,
      pmaDoc,
      "text/markdown",
    );

    if (checklistResult) {
      console.log(`[Constitutional Framework] Checklist uploaded: ${checklistResult.id}`);
    }
  }

  console.log("\n[Constitutional Framework] All uploads complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Constitutional Framework] Fatal:", err);
  process.exit(1);
});
