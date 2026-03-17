import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db";
import { generatedProtocols } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import {
  generateProtocol,
  generateProtocolPDFBuffer,
  generateDailySchedulePDFBuffer,
  generatePeptideSchedulePDFBuffer,
  runDeterministicQAChecks,
} from "../src/services/protocol-assembly";
import { generateProtocolPPTX } from "../src/services/protocol-pptx";
import { buildKathrynSmithProfile } from "../src/services/kathryn-smith-protocol";
import {
  buildAnnetteGomerProfile,
  buildCropDusterProfile,
  buildBreastCancer75FProfile,
} from "../src/services/backlog-member-protocols";
import type { HealingProtocol, PatientProfile } from "@shared/types/protocol-assembly";
import type { InsertGeneratedProtocol } from "@shared/schema";

const OUTPUT_DIR = path.resolve(process.cwd(), "generated-protocols");
const DOCTOR_ID = "trustee-michael-blake";

interface MemberConfig {
  name: string;
  buildProfile: () => PatientProfile | Promise<PatientProfile>;
  filePrefix: string;
  skipGeneration?: boolean;
}

const MEMBERS: MemberConfig[] = [
  {
    name: "Kathryn Smith",
    buildProfile: buildKathrynSmithProfile,
    filePrefix: "Kathryn_Smith",
    skipGeneration: true,
  },
  {
    name: "Annette Gomer",
    buildProfile: buildAnnetteGomerProfile,
    filePrefix: "Annette_Gomer",
  },
  {
    name: "John D.",
    buildProfile: buildCropDusterProfile,
    filePrefix: "Crop_Duster_80M",
  },
  {
    name: "Margaret R.",
    buildProfile: buildBreastCancer75FProfile,
    filePrefix: "Breast_Cancer_75F",
  },
];

async function findExistingProtocol(memberName: string): Promise<{ id: number; protocol: HealingProtocol; profile: PatientProfile } | null> {
  const records = await db
    .select()
    .from(generatedProtocols)
    .where(eq(generatedProtocols.patientName, memberName))
    .orderBy(desc(generatedProtocols.createdAt))
    .limit(1);

  if (!records.length || !records[0].protocol) return null;

  const record = records[0];
  return {
    id: record.id,
    protocol: record.protocol as unknown as HealingProtocol,
    profile: record.patientProfile as unknown as PatientProfile,
  };
}

async function storeProtocolInDB(
  profile: PatientProfile,
  protocol: HealingProtocol,
): Promise<number> {
  const mapped: InsertGeneratedProtocol = {
    patientName: profile.name,
    patientAge: profile.age,
    sourceType: "batch_generate",
    doctorId: DOCTOR_ID,
    status: "approved",
    patientProfile: profile as Record<string, unknown>,
    protocol: protocol as Record<string, unknown>,
    generatedBy: "batch-generate",
    notes: `Batch generated: ${protocol.injectablePeptides?.length || 0} injectables, ${protocol.supplements?.length || 0} supplements, ${protocol.bioregulators?.length || 0} bioregulators`,
  };

  const result = await db
    .insert(generatedProtocols)
    .values(mapped)
    .returning({ id: generatedProtocols.id });

  return result[0].id;
}

async function generateDeliverables(
  protocol: HealingProtocol,
  profile: PatientProfile,
  filePrefix: string,
): Promise<{ fullPdf: string; dailyPdf: string; peptidePdf: string; pptx: string }> {
  console.log(`  [Deliverables] Generating Full Protocol PDF...`);
  const fullPdfBuf = await generateProtocolPDFBuffer(protocol, profile);
  const fullPath = path.join(OUTPUT_DIR, `${filePrefix}_Full_Protocol.pdf`);
  fs.writeFileSync(fullPath, fullPdfBuf);
  console.log(`  [Deliverables] Full Protocol: ${(fullPdfBuf.length / 1024).toFixed(0)} KB`);

  console.log(`  [Deliverables] Generating Daily Schedule PDF...`);
  const dailyPdfBuf = await generateDailySchedulePDFBuffer(protocol, profile);
  const dailyPath = path.join(OUTPUT_DIR, `${filePrefix}_Daily_Schedule.pdf`);
  fs.writeFileSync(dailyPath, dailyPdfBuf);
  console.log(`  [Deliverables] Daily Schedule: ${(dailyPdfBuf.length / 1024).toFixed(0)} KB`);

  console.log(`  [Deliverables] Generating Peptide Schedule PDF...`);
  const peptidePdfBuf = await generatePeptideSchedulePDFBuffer(protocol, profile);
  const peptidePath = path.join(OUTPUT_DIR, `${filePrefix}_Peptide_Schedule.pdf`);
  fs.writeFileSync(peptidePath, peptidePdfBuf);
  console.log(`  [Deliverables] Peptide Schedule: ${(peptidePdfBuf.length / 1024).toFixed(0)} KB`);

  console.log(`  [Deliverables] Generating PPTX Presentation...`);
  const pptxBuf = await generateProtocolPPTX(protocol, profile);
  const pptxPath = path.join(OUTPUT_DIR, `${filePrefix}_Protocol_Presentation.pptx`);
  fs.writeFileSync(pptxPath, pptxBuf);
  console.log(`  [Deliverables] PPTX: ${(pptxBuf.length / 1024).toFixed(0)} KB`);

  return { fullPdf: fullPath, dailyPdf: dailyPath, peptidePdf: peptidePath, pptx: pptxPath };
}

async function processMember(config: MemberConfig): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[Protocol] Processing: ${config.name}`);
  console.log(`${"=".repeat(60)}`);

  const existing = await findExistingProtocol(config.name);

  let protocol: HealingProtocol;
  let profile: PatientProfile;

  if (existing && config.skipGeneration) {
    console.log(`  [Protocol] Using existing protocol record id=${existing.id}`);
    protocol = existing.protocol;
    profile = existing.profile || await config.buildProfile();
  } else {
    console.log(`  [Protocol] Building member profile...`);
    profile = await config.buildProfile();
    console.log(`  [Protocol] Profile: ${profile.name}, ${profile.age}${profile.gender?.[0]?.toUpperCase() || ""}`);
    console.log(`  [Protocol] Chief complaints: ${profile.chiefComplaints.length}`);
    console.log(`  [Protocol] Root causes: ${profile.rootCauses.length}`);
    console.log(`  [Protocol] Goals: ${profile.goals.length}`);

    console.log(`  [Protocol] Calling generateProtocol() via AI...`);
    protocol = await generateProtocol(profile);
    console.log(`  [Protocol] Generated: ${protocol.protocolDurationDays}-day protocol`);
    console.log(`  [Protocol]   Injectables: ${protocol.injectablePeptides?.length || 0}`);
    console.log(`  [Protocol]   Oral peptides: ${protocol.oralPeptides?.length || 0}`);
    console.log(`  [Protocol]   Bioregulators: ${protocol.bioregulators?.length || 0}`);
    console.log(`  [Protocol]   Supplements: ${protocol.supplements?.length || 0}`);
    console.log(`  [Protocol]   IV therapies: ${protocol.ivTherapies?.length || 0}`);
    console.log(`  [Protocol]   IM therapies: ${protocol.imTherapies?.length || 0}`);
    console.log(`  [Protocol]   Detox protocols: ${protocol.detoxProtocols?.length || 0}`);
    console.log(`  [Protocol]   Suppositories: ${protocol.suppositories?.length || 0}`);
    console.log(`  [Protocol]   ECS protocol: ${protocol.ecsProtocol ? "Yes" : "No"}`);
    console.log(`  [Protocol]   Sirtuin stack: ${protocol.sirtuinStack ? "Yes" : "No"}`);

    console.log(`  [QA] Running deterministic QA checks...`);
    const qa = runDeterministicQAChecks(protocol, profile);
    console.log(`  [QA] Issues: ${qa.issues.length}, Suggestions: ${qa.suggestions.length}, Catalog match: ${(qa.catalogMatchRate * 100).toFixed(0)}%`);
    if (qa.issues.length > 0) {
      for (const issue of qa.issues) {
        console.log(`  [QA] ISSUE: ${issue}`);
      }
      console.warn(`  [QA] WARNING: ${qa.issues.length} QA issue(s) detected — protocol generated with known gaps`);
    }

    console.log(`  [Protocol] Storing in database...`);
    const recordId = await storeProtocolInDB(profile, protocol);
    console.log(`  [Protocol] Stored as record id=${recordId}`);
  }

  console.log(`  [QA] Running pre-deliverable QA validation...`);
  const finalQA = runDeterministicQAChecks(protocol, profile);
  if (finalQA.issues.length > 0) {
    for (const issue of finalQA.issues) {
      console.error(`  [QA] FAIL: ${issue}`);
    }
    const skipQA = process.env.SKIP_QA_GATE === "true";
    if (skipQA) {
      console.warn(`  [QA] SKIP_QA_GATE=true — proceeding despite ${finalQA.issues.length} issue(s)`);
    } else {
      throw new Error(`QA HARD FAIL: ${finalQA.issues.length} deterministic issue(s) found for ${config.name}. Set SKIP_QA_GATE=true to override.`);
    }
  } else {
    console.log(`  [QA] All deterministic checks passed`);
  }

  const paths = await generateDeliverables(protocol, profile, config.filePrefix);
  console.log(`  [Protocol] All 4 deliverables generated for ${config.name}:`);
  console.log(`    Full Protocol:     ${paths.fullPdf}`);
  console.log(`    Daily Schedule:    ${paths.dailyPdf}`);
  console.log(`    Peptide Schedule:  ${paths.peptidePdf}`);
  console.log(`    PPTX Presentation: ${paths.pptx}`);
}

async function main() {
  const targetArg = process.argv[2];
  const targets = targetArg
    ? MEMBERS.filter(m =>
        m.filePrefix.toLowerCase().includes(targetArg.toLowerCase()) ||
        m.name.toLowerCase().includes(targetArg.toLowerCase())
      )
    : MEMBERS;

  if (targets.length === 0) {
    console.error(`No member found matching "${targetArg}". Available: ${MEMBERS.map(m => m.name).join(", ")}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`[Generate] Starting protocol generation for ${targets.length} member(s)`);
  console.log(`[Generate] Output directory: ${OUTPUT_DIR}`);

  let successCount = 0;
  let failCount = 0;

  for (const config of targets) {
    try {
      await processMember(config);
      successCount++;
    } catch (err: any) {
      console.error(`\n[ERROR] Failed to process ${config.name}: ${err.message}`);
      console.error(err.stack);
      failCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`[Generate] COMPLETE: ${successCount} succeeded, ${failCount} failed`);
  console.log(`[Generate] Output: ${OUTPUT_DIR}`);
  console.log(`${"=".repeat(60)}`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[Generate] Fatal:", err);
  process.exit(1);
});
