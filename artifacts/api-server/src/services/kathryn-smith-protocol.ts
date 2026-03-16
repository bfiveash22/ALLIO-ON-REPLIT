import * as fs from "fs";
import * as path from "path";
import { db } from "../db";
import {
  patientRecords,
  patientProtocols,
  generatedProtocols,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type {
  PatientProfile,
  HealingProtocol,
  ProtocolPhase,
} from "@shared/types/protocol-assembly";
import {
  analyzeTranscript,
  generateProtocol,
  fetchProtocolCitations,
  generateProtocolPDFBuffer,
  generateDailySchedulePDFBuffer,
  generatePeptideSchedulePDFBuffer,
  runProtocolQA,
  type ProtocolCitation,
} from "./protocol-assembly";
import { researchApi } from "./research-api";

const TIMELINE_FILE_PATH = path.join(
  process.cwd(),
  "docs",
  "operational",
  "KATHRYN-SMITH-TIMELINE.md"
);

interface ProtocolQAResult {
  overallScore: number;
  overallValid: boolean;
  readiness: string;
  methodology: { valid: boolean; score: number; errors: string[]; warnings: string[]; passes: string[] };
  catalog: { valid: boolean; matchRate: number; totalProducts: number; catalogMatches: number; nonCatalogItems: Array<{ name: string; category: string }>; warnings: string[] };
  template: { valid: boolean; estimatedPages: number; errors: string[]; warnings: string[]; passes: string[] };
}

interface ECSProfile {
  profileName: string;
  overview: string;
  cb1Targeting: { approach: string; rationale: string; recommendations: string[] };
  cb2Targeting: { approach: string; rationale: string; recommendations: string[] };
  cannabinoidRatios: {
    daytime: { CBD: string; CBG: string; THC: string; ratio: string; purpose: string };
    evening: { CBD: string; CBG: string; CBN: string; THC: string; ratio: string; purpose: string };
  };
  ecsSupport: string[];
  deliveryMethods: Array<{ method: string; frequency: string; rationale: string }>;
  molecularTargets: string[];
  researchBasis: string[];
}

const DOCTOR_ID = "trustee-michael-blake";
const MEMBER_ID = "kathryn-smith-2026";

function loadTimelineMarkdown(): string {
  if (!fs.existsSync(TIMELINE_FILE_PATH)) {
    throw new Error(
      `Kathryn Smith timeline file not found at ${TIMELINE_FILE_PATH}. ` +
        "Cannot rebuild protocol without source timeline data."
    );
  }
  return fs.readFileSync(TIMELINE_FILE_PATH, "utf-8");
}

export async function buildKathrynSmithProfile(): Promise<PatientProfile> {
  const timelineMarkdown = loadTimelineMarkdown();
  console.log(
    `[Kathryn Smith Rebuild] Loaded timeline from ${TIMELINE_FILE_PATH} (${timelineMarkdown.length} chars)`
  );

  const profile = await analyzeTranscript(timelineMarkdown);

  if (!profile.name || profile.name === "Unknown Patient") {
    profile.name = "Kathryn Smith";
  }
  if (!profile.age || profile.age === 0) {
    profile.age = 65;
  }
  if (!profile.gender || profile.gender === "unknown") {
    profile.gender = "female";
  }
  if (!profile.location) {
    profile.location = "Fort Worth, TX";
  }
  if (!profile.callDate) {
    profile.callDate = "2026-02-26";
  }

  return profile;
}

function buildECSProfile(): ECSProfile {
  return {
    profileName: "Kathryn Smith — ER+/PR+/HER2+ Breast Cancer ECS Optimization",
    overview:
      "The endocannabinoid system (ECS) plays a critical role in cancer biology, immune regulation, and inflammation control. For Kathryn's ER+/PR+/HER2+ breast cancer with mycotoxin burden and chronic inflammation, ECS optimization targets CB1/CB2 receptor balance, immune modulation, and anti-proliferative signaling.",
    cb1Targeting: {
      approach: "Moderate activation",
      rationale:
        "CB1 receptors in the CNS help manage pain, anxiety, and stress response. Kathryn's unresolved trauma and HPA axis dysregulation benefit from CB1-mediated anxiolysis without psychoactive overload.",
      recommendations: [
        "Low-dose THC (2.5-5mg) for stress/anxiety management",
        "CBG for neuroprotective effects without CB1 overstimulation",
      ],
    },
    cb2Targeting: {
      approach: "Aggressive activation",
      rationale:
        "CB2 receptors on immune cells directly modulate anti-tumor immunity, reduce NF-κB-driven inflammation, and promote apoptosis in cancer cells. Critical for Kathryn's chronic inflammatory state and immune suppression.",
      recommendations: [
        "High-dose CBD (50-100mg daily) for CB2-mediated anti-inflammatory and anti-proliferative effects",
        "CBG (25-50mg daily) for additional anti-tumor and anti-inflammatory activity",
        "CBN (5-10mg at bedtime) for sleep optimization and immune support",
      ],
    },
    cannabinoidRatios: {
      daytime: {
        CBD: "50mg",
        CBG: "25mg",
        THC: "2.5mg",
        ratio: "20:10:1 (CBD:CBG:THC)",
        purpose:
          "Anti-inflammatory, anti-proliferative, mood stabilization without sedation",
      },
      evening: {
        CBD: "50mg",
        CBG: "25mg",
        CBN: "10mg",
        THC: "5mg",
        ratio: "10:5:2:1 (CBD:CBG:CBN:THC)",
        purpose:
          "Deep sleep promotion, overnight immune activation, pain management, cortisol regulation",
      },
    },
    ecsSupport: [
      "Omega-3 fatty acids (2-4g EPA/DHA daily) — endocannabinoid precursors",
      "PEA (palmitoylethanolamide) 600mg 2x daily — endocannabinoid tone enhancer",
      "Dark chocolate (85%+ cacao) — anandamide support",
      "Fermented foods — gut-ECS axis optimization",
    ],
    deliveryMethods: [
      {
        method: "ECS Suppositories (FF PMA formulation)",
        frequency: "Nightly rotation",
        rationale:
          "High bioavailability, bypasses first-pass metabolism, direct pelvic/abdominal immune modulation",
      },
      {
        method: "Sublingual tincture",
        frequency: "2x daily (morning + evening)",
        rationale: "Rapid absorption, consistent dosing, easy dose adjustment",
      },
      {
        method: "Topical application to breast area",
        frequency: "Daily",
        rationale: "Localized CB2 activation at tumor site",
      },
    ],
    molecularTargets: [
      "NF-κB suppression (CBD, CBG) — reduce chronic inflammation driving cancer",
      "PI3K-AKT pathway modulation (CBD) — anti-proliferative signaling",
      "COX-2 inhibition (CBD, CBG) — reduce inflammatory prostaglandins",
      "PPARγ activation (CBD) — anti-tumor transcription factor activation",
      "TRPV1 desensitization (CBD) — pain management and anti-cancer signaling",
      "GPR55 antagonism (CBD) — blocks pro-cancer lysophosphatidylinositol signaling",
    ],
    researchBasis: [
      "Shrivastava A et al. (2011) Cannabidiol induces programmed cell death in breast cancer cells. Mol Cancer Ther.",
      "McAllister SD et al. (2007) Cannabidiol as a novel inhibitor of Id-1 gene expression in aggressive breast cancer cells. Mol Cancer Ther.",
      "Ligresti A et al. (2006) Antitumor activity of plant cannabinoids with emphasis on the effect of cannabidiol on human breast carcinoma. J Pharmacol Exp Ther.",
      "Blasco-Benito S et al. (2018) Appraising the 'entourage effect': Antitumor action of a pure cannabinoid versus a botanical drug preparation in preclinical models of breast cancer. Biochem Pharmacol.",
    ],
  };
}

const FIVE_R_PHASES: Array<{
  name: string;
  displayName: string;
  description: string;
  keyActions: string[];
}> = [
  {
    name: "REMOVE",
    displayName: "Phase 1: REMOVE (Weeks 1-3)",
    description: "Eliminate toxins, pathogens, and environmental insults that created the disease environment.",
    keyActions: [
      "Begin mycotoxin binding protocol (activated charcoal, bentonite clay, chlorella)",
      "Schedule amalgam filling removal with biological dentist (SMART protocol)",
      "Start anti-parasitic protocol (mimosa pudica seed, black walnut, wormwood)",
      "Eliminate inflammatory foods (gluten, dairy, sugar, processed foods, alcohol)",
      "Begin infrared sauna therapy (3x weekly) for mobilization of stored toxins",
    ],
  },
  {
    name: "RESTORE",
    displayName: "Phase 2: RESTORE (Weeks 3-5)",
    description: "Restore gut integrity, microbiome balance, and digestive function damaged by childhood antibiotics and chronic inflammation.",
    keyActions: [
      "Introduce gut-healing compounds (L-glutamine, colostrum, DGL licorice)",
      "Begin probiotic protocol (spore-based + multi-strain, 100B+ CFU)",
      "Start BPC-157 for mucosal and systemic tissue repair",
      "Implement bone broth protocol (daily, organic, slow-cooked)",
      "Begin digestive enzyme support with meals",
    ],
  },
  {
    name: "REPLENISH",
    displayName: "Phase 3: REPLENISH (Weeks 5-8)",
    description: "Replenish severely depleted minerals and nutrients essential for immune function and tumor suppressor gene restoration.",
    keyActions: [
      "Begin copper supplementation protocol (copper sebacate, monitored dosing)",
      "Start iodine protocol (Lugol's solution, gradual titration with selenium companion)",
      "Begin selenium supplementation (selenomethionine 200-400mcg daily)",
      "Start Dr. Wallach's 90 Essential Nutrients protocol (Youngevity formulation)",
      "Begin IV nutrient therapy: high-dose Vitamin C (25-75g), Myers' cocktail",
      "Start zinc supplementation for immune restoration",
    ],
  },
  {
    name: "REGENERATE",
    displayName: "Phase 4: REGENERATE (Weeks 8-11)",
    description: "Activate regenerative peptides, bioregulators, and immune-modulating compounds to restore cellular function and anti-tumor immunity.",
    keyActions: [
      "Begin Thymosin Alpha-1 (TA-1) for immune system activation and anti-tumor immunity",
      "Start KPV peptide for NF-κB suppression and anti-inflammatory signaling",
      "Begin ECS optimization protocol (CBD/CBG/CBN cannabinoid therapy per ECS profile)",
      "Start bioregulator peptides (Endoluten, Ventfort, Crystagen)",
      "Begin hyperbaric oxygen therapy (HBOT) for tissue oxygenation",
      "Start IM glutathione for antioxidant support and detox enhancement",
    ],
  },
  {
    name: "REBALANCE",
    displayName: "Phase 5: REBALANCE (Weeks 11-13+)",
    description: "Rebalance hormones, HPA axis, and establish long-term maintenance protocol to prevent recurrence.",
    keyActions: [
      "Begin trauma resolution therapy (somatic experiencing, EMDR, or equivalent)",
      "Implement cortisol management protocol (adaptogenic herbs, meditation, breathwork)",
      "Start hormone balancing (bioidentical progesterone if indicated, DIM for estrogen metabolism)",
      "Establish long-term ECS maintenance dosing",
      "Create follow-up lab schedule (30/60/90 day panels)",
      "Build sustainable lifestyle protocol (sleep hygiene, exercise prescription, stress management)",
    ],
  },
];

function enforce5RPhases(protocol: HealingProtocol): HealingProtocol {
  const existingPhases = protocol.phases || [];
  const mergedPhases: ProtocolPhase[] = FIVE_R_PHASES.map((template, idx) => {
    const existing = existingPhases.find(
      (p) => p.name?.toUpperCase().includes(template.name)
    );
    return {
      phaseNumber: idx + 1,
      name: `${template.displayName}`,
      weekRange: `Weeks ${idx * 2 + 1}-${idx * 2 + 3}`,
      focus: existing?.focus || template.description,
      keyActions: existing?.keyActions?.length
        ? existing.keyActions
        : template.keyActions,
    };
  });

  return {
    ...protocol,
    phases: mergedPhases,
  };
}

function persistPDF(pdfBuffer: Buffer, patientName: string, dateStr: string): string {
  const sanitizedName = patientName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${sanitizedName}_protocol_${dateStr}.pdf`;
  const outputDir = path.join(process.cwd(), "public", "protocols");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`[Kathryn Smith Rebuild] PDF written to ${filePath}`);
  return `/downloads/protocols/${filename}`;
}

export async function rebuildKathrynSmithProtocol(): Promise<{
  patientRecordId: string;
  patientProtocolId: string;
  generatedProtocolId: number;
  profile: PatientProfile;
  protocol: HealingProtocol;
  ecsProfile: ECSProfile;
  citations: ProtocolCitation[];
  qaResult: ProtocolQAResult | { error: string; details: string };
  pdfSize: number;
  pdfUrl: string;
}> {
  console.log("[Kathryn Smith Rebuild] Starting full 90-day protocol rebuild...");

  const profile = await buildKathrynSmithProfile();
  console.log("[Kathryn Smith Rebuild] Patient profile parsed from timeline file");

  let patientRecordId: string;
  const [existingRecord] = await db
    .select()
    .from(patientRecords)
    .where(eq(patientRecords.memberId, MEMBER_ID))
    .limit(1);

  if (existingRecord) {
    patientRecordId = existingRecord.id;
    await db
      .update(patientRecords)
      .set({
        memberName: profile.name,
        primaryConcerns: profile.chiefComplaints,
        symptomTimeline: profile.medicalTimeline as unknown as Record<string, unknown>,
        environmentalFactors: profile.environmentalExposures as unknown as Record<string, unknown>,
        nutritionalDeficiencies: profile.deficiencies as unknown as Record<string, unknown>,
        toxicityAssessment: {
          mercuryExposure: profile.environmentalExposures?.heavyMetalDetails,
          moldExposure: profile.environmentalExposures?.moldDetails,
          amalgamFillings: profile.environmentalExposures?.amalgamCount,
          amalgamYears: profile.environmentalExposures?.amalgamYears,
        },
        familyHistory: {
          cancerHistory:
            "Mother, sister, and grandmother all underwent traditional chemo/radiation with poor outcomes",
          familySupport: "Husband of 42 years, 6 children, 14 grandchildren",
        },
        previousTreatments: {
          firstCancer: "Lumpectomy ~2018, right breast, no root cause treatment",
          currentApproach: "Seeking alternative through Forgotten Formula PMA",
        },
        currentMedications: profile.currentMedications,
        notes:
          "Second occurrence breast cancer. ER+/PR+/HER2+. Strong opposition to chemo/radiation. Determined and informed patient with high expected compliance. Guided to FF PMA 2 days post-diagnosis.",
        updatedAt: new Date(),
      })
      .where(eq(patientRecords.id, patientRecordId));
    console.log(`[Kathryn Smith Rebuild] Updated existing patient record: ${patientRecordId}`);
  } else {
    const [newRecord] = await db
      .insert(patientRecords)
      .values({
        doctorId: DOCTOR_ID,
        memberId: MEMBER_ID,
        memberName: profile.name,
        memberEmail: null,
        phone: null,
        dateOfBirth: new Date("1961-01-01"),
        status: "active",
        primaryConcerns: profile.chiefComplaints,
        symptomTimeline: profile.medicalTimeline as unknown as Record<string, unknown>,
        environmentalFactors: profile.environmentalExposures as unknown as Record<string, unknown>,
        nutritionalDeficiencies: profile.deficiencies as unknown as Record<string, unknown>,
        toxicityAssessment: {
          mercuryExposure: profile.environmentalExposures?.heavyMetalDetails,
          moldExposure: profile.environmentalExposures?.moldDetails,
          amalgamFillings: profile.environmentalExposures?.amalgamCount,
          amalgamYears: profile.environmentalExposures?.amalgamYears,
        },
        familyHistory: {
          cancerHistory:
            "Mother, sister, and grandmother all underwent traditional chemo/radiation with poor outcomes",
          familySupport: "Husband of 42 years, 6 children, 14 grandchildren",
        },
        previousTreatments: {
          firstCancer: "Lumpectomy ~2018, right breast, no root cause treatment",
          currentApproach: "Seeking alternative through Forgotten Formula PMA",
        },
        currentMedications: profile.currentMedications,
        notes:
          "Second occurrence breast cancer. ER+/PR+/HER2+. Strong opposition to chemo/radiation. Determined and informed patient with high expected compliance. Guided to FF PMA 2 days post-diagnosis.",
      })
      .returning({ id: patientRecords.id });
    patientRecordId = newRecord.id;
    console.log(`[Kathryn Smith Rebuild] Created patient record: ${patientRecordId}`);
  }

  console.log("[Kathryn Smith Rebuild] Generating 5R protocol via AI...");
  let protocol = await generateProtocol(profile);
  protocol = enforce5RPhases(protocol);
  console.log("[Kathryn Smith Rebuild] Protocol generated and 5R phases enforced");

  const ecsProfile = buildECSProfile();
  console.log("[Kathryn Smith Rebuild] ECS optimization profile built");

  console.log("[Kathryn Smith Rebuild] Fetching research citations...");
  let citations: ProtocolCitation[] = [];
  try {
    citations = await fetchProtocolCitations(protocol, profile);

    const additionalSearches = [
      "ER+ PR+ HER2+ breast cancer integrative peptide therapy",
      "mycotoxin exposure breast cancer risk NF-kB inflammation",
      "copper deficiency p53 tumor suppressor gene regulation",
      "childhood trauma cortisol estrogen dominance breast cancer risk",
      "cannabidiol CBD breast cancer anti-proliferative",
    ];

    for (const searchTerm of additionalSearches) {
      try {
        await researchApi.agentSearch(
          "DR_FORMULA",
          "DR. FORMULA",
          searchTerm,
          "Kathryn Smith protocol rebuild — targeted citation search"
        );
      } catch (err) {
        console.warn(`[Kathryn Smith Rebuild] Additional search failed for "${searchTerm}":`, err);
      }
    }

    citations = await fetchProtocolCitations(protocol, profile);
    console.log(`[Kathryn Smith Rebuild] Fetched ${citations.length} citations`);
  } catch (err) {
    console.warn("[Kathryn Smith Rebuild] Citation fetch had errors:", err);
  }

  const MIN_CITATIONS = 3;
  if (citations.length < MIN_CITATIONS) {
    throw new Error(
      `Insufficient research backing: only ${citations.length} citations found (minimum ${MIN_CITATIONS} required). ` +
        "Cannot generate a research-backed protocol without adequate citations."
    );
  }

  console.log("[Kathryn Smith Rebuild] Running protocol QA...");
  let qaResult: ProtocolQAResult | { error: string; details: string } = { error: "Not run", details: "" };
  try {
    const qaOutput = await runProtocolQA(protocol);
    qaResult = qaOutput;
    console.log(`[Kathryn Smith Rebuild] QA complete — score: ${qaOutput.overallScore}, readiness: ${qaOutput.readiness}`);
  } catch (err) {
    console.warn("[Kathryn Smith Rebuild] QA check failed:", err);
    qaResult = { error: "QA check failed", details: String(err) };
  }

  console.log("[Kathryn Smith Rebuild] Generating all 3 protocol PDFs...");
  let pdfBuffer: Buffer;
  let dailyPdfBuffer: Buffer;
  let peptidePdfBuffer: Buffer;
  let pdfUrl = "";
  let driveLinks: { full?: string; daily?: string; peptide?: string; fullFileId?: string; dailyFileId?: string; peptideFileId?: string } = {};
  try {
    [pdfBuffer, dailyPdfBuffer, peptidePdfBuffer] = await Promise.all([
      generateProtocolPDFBuffer(protocol, profile, citations),
      generateDailySchedulePDFBuffer(protocol, profile),
      generatePeptideSchedulePDFBuffer(protocol, profile),
    ]);
    const dateStr = protocol.generatedDate || new Date().toISOString().split("T")[0];
    pdfUrl = persistPDF(pdfBuffer, protocol.patientName, dateStr);
    console.log(`[Kathryn Smith Rebuild] 3 PDFs generated: Full(${pdfBuffer.length}), Daily(${dailyPdfBuffer.length}), Peptide(${peptidePdfBuffer.length})`);

    try {
      const { uploadProtocolToDrive } = await import("./drive");
      const safeName = protocol.patientName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const [fullResult, dailyResult, peptideResult] = await Promise.all([
        uploadProtocolToDrive(pdfBuffer, `${safeName}_Full_Protocol_${dateStr}.pdf`),
        uploadProtocolToDrive(dailyPdfBuffer, `${safeName}_Daily_Schedule_${dateStr}.pdf`),
        uploadProtocolToDrive(peptidePdfBuffer, `${safeName}_Peptide_Schedule_${dateStr}.pdf`),
      ]);
      if (fullResult.success) {
        driveLinks.full = fullResult.webViewLink || undefined;
        driveLinks.fullFileId = fullResult.fileId || undefined;
        console.log(`[Kathryn Smith Rebuild] Full Protocol PDF → Drive: ${fullResult.webViewLink}`);
      }
      if (dailyResult.success) {
        driveLinks.daily = dailyResult.webViewLink || undefined;
        driveLinks.dailyFileId = dailyResult.fileId || undefined;
        console.log(`[Kathryn Smith Rebuild] Daily Schedule PDF → Drive: ${dailyResult.webViewLink}`);
      }
      if (peptideResult.success) {
        driveLinks.peptide = peptideResult.webViewLink || undefined;
        driveLinks.peptideFileId = peptideResult.fileId || undefined;
        console.log(`[Kathryn Smith Rebuild] Peptide Schedule PDF → Drive: ${peptideResult.webViewLink}`);
      }
    } catch (driveErr) {
      console.warn("[Kathryn Smith Rebuild] Drive upload failed (non-fatal):", driveErr);
    }
  } catch (err) {
    console.error("[Kathryn Smith Rebuild] PDF generation failed:", err);
    pdfBuffer = Buffer.alloc(0);
    dailyPdfBuffer = Buffer.alloc(0);
    peptidePdfBuffer = Buffer.alloc(0);
  }

  const PROTOCOL_TYPE = "comprehensive-5r";
  const PROTOCOL_NAME = "Kathryn Smith — Complete 90-Day 5R Healing Protocol (v2.0)";
  const PROTOCOL_DESCRIPTION =
    "Full 5R protocol rebuild: REMOVE (detox mycotoxins, chelate mercury), RESTORE (gut healing, anti-parasitic), REPLENISH (copper, iodine, selenium, 90 nutrients), REGENERATE (peptides, IV therapy, bioregulators, ECS optimization), REBALANCE (trauma work, lifestyle, follow-up). Addresses ER+/PR+/HER2+ breast cancer recurrence through root cause resolution.";
  const EXPECTED_OUTCOMES = [
    "Mycotoxin burden reduction (measured via urine mycotoxin panel)",
    "Mercury clearance post-amalgam removal (hair/blood mercury levels)",
    "Copper, iodine, selenium levels normalized (serum testing)",
    "p53/p21 gene function restoration indicators",
    "Tumor marker improvement (ER/PR/HER2 status on follow-up)",
    "Chronic cough/mucus resolution",
    "Immune function restoration (NK cell activity, lymphocyte panels)",
    "Cortisol normalization (24-hour cortisol curve)",
    "Quality of life improvement (patient-reported outcomes)",
  ];

  const protocolDataJson = {
    healingProtocol: protocol,
    patientProfile: profile,
    ecsProfile,
    citations,
    qaResult,
    molecularTargets: {
      "PI3K-AKT": "Cancer growth pathway — targeted by Thymosin Alpha-1, high-dose Vitamin C IV, CBD",
      "NF-κB": "Chronic inflammation driver (mycotoxin-mediated) — targeted by KPV, BPC-157, CBD, CBG",
      "Estrogen Receptor (ER+/PR+)": "Hormone-driven cancer — addressed via trauma resolution, cortisol normalization, iodine/selenium repletion",
      "HER2": "Growth factor receptor overexpression — addressed via immune activation (TA-1), cannabinoid therapy, copper repletion for p53 restoration",
      "p53/p21": "Tumor suppressor genes suppressed by copper deficiency and parasitic burden — restored via copper repletion + anti-parasitic protocol",
    },
    generatedBy: "DR_FORMULA",
    generatedAt: new Date().toISOString(),
    version: "2.0-rebuild",
    pdfSize: pdfBuffer.length,
    pdfUrl,
  };

  console.log("[Kathryn Smith Rebuild] Saving all records in transaction...");
  const { generatedProtocolId, patientProtocolId } = await db.transaction(async (tx) => {
    const [genProto] = await tx
      .insert(generatedProtocols)
      .values({
        patientName: protocol.patientName,
        patientAge: protocol.patientAge,
        sourceType: "transcript",
        intakeFormId: null,
        memberId: MEMBER_ID,
        patientProfile: profile as unknown as Record<string, unknown>,
        protocol: protocol as unknown as Record<string, unknown>,
        status: "draft",
        generatedBy: "DR_FORMULA",
        pdfDriveFileId: driveLinks.fullFileId || null,
        pdfDriveWebViewLink: driveLinks.full || null,
        dailySchedulePdfFileId: driveLinks.dailyFileId || null,
        dailySchedulePdfWebViewLink: driveLinks.daily || null,
        peptideSchedulePdfFileId: driveLinks.peptideFileId || null,
        peptideSchedulePdfWebViewLink: driveLinks.peptide || null,
      })
      .returning({ id: generatedProtocols.id });
    const genId = genProto.id;
    console.log(`[Kathryn Smith Rebuild] Saved generated protocol: ${genId}`);

    const [existingProtocol] = await tx
      .select()
      .from(patientProtocols)
      .where(
        and(
          eq(patientProtocols.patientRecordId, patientRecordId),
          eq(patientProtocols.protocolType, PROTOCOL_TYPE)
        )
      )
      .limit(1);

    let ppId: string;
    if (existingProtocol) {
      ppId = existingProtocol.id;
      await tx
        .update(patientProtocols)
        .set({
          protocolName: PROTOCOL_NAME,
          description: PROTOCOL_DESCRIPTION,
          status: "active",
          products: protocolDataJson as unknown as Record<string, unknown>,
          schedule: protocol.dailySchedule as unknown as Record<string, unknown>,
          duration: "90 days (13 weeks)",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          expectedOutcomes: EXPECTED_OUTCOMES,
          updatedAt: new Date(),
        })
        .where(eq(patientProtocols.id, ppId));
      console.log(`[Kathryn Smith Rebuild] Updated patient protocol: ${ppId}`);
    } else {
      const [newProtocol] = await tx
        .insert(patientProtocols)
        .values({
          patientRecordId,
          doctorId: DOCTOR_ID,
          protocolName: PROTOCOL_NAME,
          protocolType: PROTOCOL_TYPE,
          description: PROTOCOL_DESCRIPTION,
          status: "active",
          products: protocolDataJson as unknown as Record<string, unknown>,
          schedule: protocol.dailySchedule as unknown as Record<string, unknown>,
          duration: "90 days (13 weeks)",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          expectedOutcomes: EXPECTED_OUTCOMES,
        })
        .returning({ id: patientProtocols.id });
      ppId = newProtocol.id;
      console.log(`[Kathryn Smith Rebuild] Created patient protocol: ${ppId}`);
    }

    return { generatedProtocolId: genId, patientProtocolId: ppId };
  });

  const qaScoreDisplay = "overallScore" in qaResult ? String(qaResult.overallScore) : "N/A";

  console.log("[Kathryn Smith Rebuild] Complete protocol rebuild finished!");
  console.log(`  Patient Record: ${patientRecordId}`);
  console.log(`  Patient Protocol: ${patientProtocolId}`);
  console.log(`  Generated Protocol: ${generatedProtocolId}`);
  console.log(`  Citations: ${citations.length}`);
  console.log(`  PDF Size: ${pdfBuffer.length} bytes`);
  console.log(`  PDF URL: ${pdfUrl}`);
  console.log(`  QA Score: ${qaScoreDisplay}`);

  return {
    patientRecordId,
    patientProtocolId,
    generatedProtocolId,
    profile,
    protocol,
    ecsProfile,
    citations,
    qaResult,
    pdfSize: pdfBuffer.length,
    pdfUrl,
  };
}
