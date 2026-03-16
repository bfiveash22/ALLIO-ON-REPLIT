import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { db } from "../db";
import { generatedProtocols, type GeneratedProtocol } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
// Protocol transcripts are sourced from Google Drive folder ID: 10BqHP7hXwBGskvoNePMuvFuTNspKy0ur
// See PROTOCOL_TRANSCRIPTS_FOLDER_ID in services/drive.ts
import {
  peptides,
  ivTherapies,
  imTherapies,
  bioregulators,
  oralPeptides,
  suppositories,
  supplements,
  exosomes,
  topicals,
} from "../protocol-knowledge";
import type {
  PatientProfile,
  HealingProtocol,
} from "@shared/types/protocol-assembly";
import {
  getUncachableSlidesClient,
} from "./slides";
import { researchApi } from "./research-api";
import { generateProtocolPDF, generateDailySchedulePDF, generatePeptideSchedulePDF } from "./protocol-pdf";

export interface ProtocolCitation {
  title: string;
  authors: string[];
  journal?: string;
  year?: string;
  url?: string;
  doi?: string;
}

export async function fetchProtocolCitations(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<ProtocolCitation[]> {
  const citations: ProtocolCitation[] = [];

  try {
    const searchTerms: string[] = [];

    if (profile.chiefComplaints?.length > 0) {
      searchTerms.push(profile.chiefComplaints.slice(0, 2).join(" ") + " treatment protocol");
    }

    if (protocol.injectablePeptides?.length > 0) {
      const topPeptides = protocol.injectablePeptides.slice(0, 3).map((p) => p.name);
      searchTerms.push(topPeptides.join(" ") + " peptide therapy");
    }

    if (protocol.rootCauseAnalysis?.length > 0) {
      const topCause = protocol.rootCauseAnalysis[0];
      searchTerms.push(`${topCause.cause} root cause integrative medicine`);
    }

    if (protocol.detoxProtocols?.length > 0) {
      searchTerms.push("chelation detoxification protocol evidence");
    }

    if (searchTerms.length === 0) {
      searchTerms.push("integrative medicine personalized protocol");
    }

    const allPaperIds: string[] = [];
    for (const term of searchTerms.slice(0, 3)) {
      try {
        const paperIds = await researchApi.agentSearch(
          "DR_FORMULA",
          "DR. FORMULA",
          term,
          "Protocol citation for patient protocol generation"
        );
        allPaperIds.push(...paperIds);
      } catch (err) {
        console.warn(`[Protocol Assembly] Research search failed for "${term}":`, err);
      }
    }

    if (allPaperIds.length > 0) {
      const { researchPapers } = await import("@shared/schema");
      const { inArray } = await import("drizzle-orm");

      const uniqueIds = [...new Set(allPaperIds)].slice(0, 10);
      const papers = await db
        .select()
        .from(researchPapers)
        .where(inArray(researchPapers.id, uniqueIds));

      papers.forEach((paper) => {
        citations.push({
          title: paper.title,
          authors: (paper.authors as string[]) || [],
          journal: paper.journal || undefined,
          year: paper.publicationDate?.split("-")[0] || undefined,
          url: paper.url || undefined,
          doi: paper.doi || undefined,
        });
      });
    }
  } catch (err) {
    console.warn("[Protocol Assembly] Citation fetch failed:", err);
  }

  return citations;
}

export async function generateProtocolPDFBuffer(
  protocol: HealingProtocol,
  profile: PatientProfile,
  citations?: ProtocolCitation[]
): Promise<Buffer> {
  return generateProtocolPDF(protocol, profile, citations);
}

export async function generateDailySchedulePDFBuffer(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  return generateDailySchedulePDF(protocol, profile);
}

export async function generatePeptideSchedulePDFBuffer(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  return generatePeptideSchedulePDF(protocol, profile);
}

export async function runProtocolQA(protocol: HealingProtocol): Promise<{
  overallScore: number;
  overallValid: boolean;
  readiness: string;
  methodology: { valid: boolean; score: number; errors: string[]; warnings: string[]; passes: string[] };
  catalog: { valid: boolean; matchRate: number; totalProducts: number; catalogMatches: number; nonCatalogItems: Array<{ name: string; category: string }>; warnings: string[] };
  template: { valid: boolean; estimatedPages: number; errors: string[]; warnings: string[]; passes: string[] };
}> {
  const { createRequire } = await import("module");
  const requireFn = createRequire(typeof import.meta?.url === "string" && import.meta.url !== "" ? import.meta.url : __filename ?? "file://" + process.cwd() + "/index.js");

  const scriptBase = path.resolve(process.cwd(), ".agents/skills/dr-formula-assistant/scripts");
  const validateProtocolModule = requireFn(path.join(scriptBase, "validate-protocol.js"));
  const catalogCheckerModule = requireFn(path.join(scriptBase, "catalog-checker.js"));
  const templateAuditModule = requireFn(path.join(scriptBase, "template-audit.js"));

  const validationResult = validateProtocolModule.validateProtocol(protocol);
  const catalogResult = catalogCheckerModule.checkCatalog(protocol);
  const templateResult = templateAuditModule.auditTemplate(protocol);

  const overallScore = Math.round(
    validationResult.score * 0.4 +
    catalogResult.catalogPercentage * 0.3 +
    (templateResult.valid ? 100 : 50) * 0.3
  );

  const overallValid = validationResult.valid && catalogResult.valid && templateResult.valid;

  let readiness: string;
  if (overallScore >= 90 && overallValid) {
    readiness = "READY FOR DELIVERY";
  } else if (overallScore >= 70) {
    readiness = "NEEDS MINOR REVISIONS";
  } else if (overallScore >= 50) {
    readiness = "NEEDS SIGNIFICANT REVISIONS";
  } else {
    readiness = "REJECT — MAJOR ISSUES";
  }

  return {
    overallScore,
    overallValid,
    readiness,
    methodology: {
      valid: validationResult.valid,
      score: validationResult.score,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      passes: validationResult.passes,
    },
    catalog: {
      valid: catalogResult.valid,
      matchRate: catalogResult.catalogPercentage,
      totalProducts: catalogResult.totalProducts,
      catalogMatches: catalogResult.catalogMatches.length,
      nonCatalogItems: catalogResult.nonCatalogItems,
      warnings: catalogResult.warnings,
    },
    template: {
      valid: templateResult.valid,
      estimatedPages: templateResult.estimatedPages,
      errors: templateResult.errors,
      warnings: templateResult.warnings,
      passes: templateResult.passes,
    },
  };
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let cachedDetoxKnowledge: string | null = null;

function loadDetoxKnowledge(): string {
  if (cachedDetoxKnowledge !== null) return cachedDetoxKnowledge;

  const detoxDir = path.join(
    process.cwd(),
    "knowledge-base",
    "detox-protocols"
  );
  let knowledge = "";
  try {
    const files = fs.readdirSync(detoxDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(detoxDir, file), "utf-8");
      knowledge += `\n\n=== ${file.replace(".md", "").toUpperCase()} ===\n${content}`;
    }
  } catch {
    console.log("[Protocol Assembly] No detox knowledge files found");
  }
  cachedDetoxKnowledge = knowledge;
  return knowledge;
}

function buildKnowledgeBase(): string {
  const safeMap = <T>(arr: T[] | undefined | null, mapper: (item: T) => string): string =>
    arr && Array.isArray(arr) ? arr.map(mapper).join("\n") : "";

  const peptideList = safeMap(
    peptides,
    (p) =>
      `- ${p.name} (${p.era}): ${p.therapeuticUses?.join(", ")} | Dose: ${p.dosageInfo}`
  );
  const ivList = safeMap(
    ivTherapies,
    (iv) =>
      `- ${iv.name} (${iv.category}): ${iv.benefits?.join(", ")} | Infusion: ${iv.infusionTime || "Standard"}`
  );
  const imList = safeMap(
    imTherapies,
    (im) =>
      `- ${im.name} (${im.category}): ${im.benefits?.join(", ")} | Dose: ${im.dosageRange}`
  );
  const bioList = safeMap(
    bioregulators,
    (b) =>
      `- ${b.name} → ${b.targetOrgan}: ${b.mechanism} | Dose: ${b.dosageInfo}`
  );
  const oralList = safeMap(
    oralPeptides,
    (o) =>
      `- ${o.name} (${o.category}): ${o.benefits?.join(", ")} | ${o.directions}`
  );
  const suppList = safeMap(
    suppositories,
    (s) => `- ${s.name}: ${s.benefits?.join(", ")} | ${s.directions}`
  );
  const supplList = safeMap(
    supplements,
    (s) =>
      `- ${s.name} (${s.form}): ${s.benefits?.join(", ")} | Dose: ${s.dosageInfo}`
  );
  const exoList = safeMap(
    exosomes,
    (e) =>
      `- ${e.name}: ${e.benefits?.join(", ")} | ${e.concentration} ${e.volume}`
  );
  const topList = safeMap(
    topicals,
    (t) =>
      `- ${t.name} (${t.form}): ${t.benefits?.join(", ")} | ${t.application}`
  );

  return `AVAILABLE THERAPIES:

INJECTABLE PEPTIDES (${peptides?.length || 0}):
${peptideList}

IV THERAPIES (${ivTherapies?.length || 0}):
${ivList}

IM THERAPIES (${imTherapies?.length || 0}):
${imList}

BIOREGULATORS (${bioregulators?.length || 0}):
${bioList}

ORAL PEPTIDES (${oralPeptides?.length || 0}):
${oralList}

SUPPOSITORIES (${suppositories?.length || 0}):
${suppList}

SUPPLEMENTS (${supplements?.length || 0}):
${supplList}

EXOSOMES (${exosomes?.length || 0}):
${exoList}

TOPICALS (${topicals?.length || 0}):
${topList}`;
}

export async function analyzeTranscript(
  transcript: string
): Promise<PatientProfile> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a clinical data extraction expert for Forgotten Formula PMA. Analyze the call transcript and extract a structured patient profile.

Extract ALL of the following into valid JSON matching the PatientProfile interface:
- name, age, gender, location, callDate
- chiefComplaints: array of primary health concerns
- currentDiagnoses: array of diagnosed conditions
- currentMedications: array of current meds
- medicalTimeline: array of {ageRange, year?, event, significance}
- rootCauses: array of {rank (1-5), cause, category (primary/secondary/tertiary/quaternary/quinary), details, relatedSymptoms[]}
- environmentalExposures: {moldExposure, moldDetails?, heavyMetals, heavyMetalDetails?, amalgamFillings, amalgamCount?, amalgamYears?, pesticides, radiation, otherToxins?}
- traumaHistory: {childhoodTrauma, traumaDetails?, aceScore?, earlyPuberty?, significantStressors?}
- surgicalHistory: array of surgeries
- gutHealth: {gallbladderRemoved, appendixRemoved, digestiveIssues[], probioticHistory?}
- hormoneStatus: {thyroidIssues?, estrogenDominance?, hormoneDetails?}
- parasiteStatus: {everTreated, treatmentDetails?}
- dentalHistory: {amalgamFillings, rootCanals, cavitations?}
- deficiencies: array of suspected deficiencies
- contraindications: array of things to avoid
- goals: array of patient goals

Use clinical reasoning to identify root causes from the data. Follow the FF PMA 5 Root Causes framework:
1. Toxicity (mercury, mold, chemicals)
2. Gut Dysbiosis (microbiome disruption)
3. Hormonal/Endocrine Disruption
4. Parasitic/Viral Burden
5. Trauma/Emotional (ACE scores, HPA axis)

Return ONLY valid JSON, no markdown.`,
      },
      {
        role: "user",
        content: `CALL TRANSCRIPT:\n\n${transcript}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Failed to extract patient profile from transcript");

  const parsed = JSON.parse(content);

  const profile: PatientProfile = {
    name: parsed.name || "Unknown Patient",
    age: parsed.age || 0,
    gender: parsed.gender || "unknown",
    location: parsed.location,
    callDate: parsed.callDate,
    chiefComplaints: parsed.chiefComplaints || [],
    currentDiagnoses: parsed.currentDiagnoses || [],
    currentMedications: parsed.currentMedications || [],
    medicalTimeline: parsed.medicalTimeline || [],
    rootCauses: parsed.rootCauses || [],
    environmentalExposures: parsed.environmentalExposures || {
      moldExposure: false,
      heavyMetals: false,
      amalgamFillings: false,
      pesticides: false,
      radiation: false,
    },
    traumaHistory: parsed.traumaHistory || {
      childhoodTrauma: false,
    },
    surgicalHistory: parsed.surgicalHistory || [],
    gutHealth: parsed.gutHealth || {
      gallbladderRemoved: false,
      appendixRemoved: false,
      digestiveIssues: [],
    },
    hormoneStatus: parsed.hormoneStatus || {},
    parasiteStatus: parsed.parasiteStatus || { everTreated: false },
    dentalHistory: parsed.dentalHistory || {
      amalgamFillings: false,
      rootCanals: 0,
    },
    deficiencies: parsed.deficiencies || [],
    contraindications: parsed.contraindications || [],
    goals: parsed.goals || [],
    rawTranscript: transcript,
  };

  return profile;
}

export async function generateProtocol(
  profile: PatientProfile
): Promise<HealingProtocol> {
  const knowledgeBase = buildKnowledgeBase();
  const detoxKnowledge = loadDetoxKnowledge();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are the Forgotten Formula Protocol Architect. Given a patient profile, generate a comprehensive 90-day healing protocol.

${knowledgeBase}

DETOX PROTOCOLS KNOWLEDGE:
${detoxKnowledge}

PROTOCOL STRUCTURE (output as valid JSON matching HealingProtocol):
{
  "patientName": string,
  "patientAge": number,
  "generatedDate": "YYYY-MM-DD",
  "protocolDurationDays": 90,
  "summary": "2-3 sentence protocol overview",
  "rootCauseAnalysis": [{rank, cause, category, details, relatedSymptoms[]}],
  "phases": [{phaseNumber, name, weekRange, focus, keyActions[]}],
  "dailySchedule": {
    "morning": [{time?, item, details?, frequency?}],
    "midday": [{time?, item, details?, frequency?}],
    "evening": [{time?, item, details?, frequency?}],
    "bedtime": [{time?, item, details?, frequency?}]
  },
  "injectablePeptides": [{name, vialSize, reconstitution, dose, frequency, duration, route, purpose, notes?}],
  "oralPeptides": [{name, dose, frequency, duration, purpose}],
  "bioregulators": [{name, targetOrgan, dose, frequency, duration}],
  "supplements": [{name, dose, timing, purpose}],
  "ivTherapies": [{name, frequency, duration, purpose, notes?}],
  "imTherapies": [{name, dose, frequency, purpose}],
  "detoxProtocols": [{name, method, frequency, duration, instructions}],
  "parasiteAntiviralProtocols": [{name, dose, schedule, duration, purpose}],
  "lifestyleRecommendations": [{category, recommendation, details?}],
  "dietaryGuidelines": [string],
  "followUpPlan": [{weekNumber, action, details?}],
  "contraindications": [string],
  "labsRequired": [string]
}

RULES:
1. ONLY select therapies from the available knowledge base above
2. Include specific dosages, reconstitution instructions, and syringe sizes
3. Structure as 3-4 phases (Foundation/Detox → Targeted Therapy → Regeneration → Maintenance)
4. Daily schedule must include exact products and timing
5. Always include: detox baths (3x/week min), parasite protocols, hydration guidance
6. Include MitoStac, Reds + Greens, Elixir, Bio-Vitamin, and Mighty Blue in supplement stack when appropriate
7. Include ECS suppository rotation when gut/immune issues present
8. Nebulization protocol (saline + peroxide + iodine) 3x weekly when respiratory issues present
9. Follow the FF PMA Trustee daily schedule format (Morning/Midday/Evening/Bedtime blocks)
10. Be clinically aggressive - these are PMA member protocols

Return ONLY valid JSON, no markdown.`,
      },
      {
        role: "user",
        content: `PATIENT PROFILE:\n${JSON.stringify(profile, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 8000,
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Failed to generate protocol");

  return JSON.parse(content) as HealingProtocol;
}

interface IntakeFormData {
  basicInfo?: { primaryConcern?: string; name?: string; email?: string; phone?: string; age?: number; dateOfBirth?: string };
  timeline?: Record<string, unknown>;
  environmental?: { moldExposure?: string; heavyMetals?: Record<string, unknown>; chemicalExposure?: string; waterQuality?: string };
  trauma?: Record<string, unknown>;
  symptoms?: Record<string, unknown>;
  surgical?: Record<string, unknown>;
  lifestyle?: { dietType?: string; exerciseFrequency?: string; sleepHours?: number; stressLevel?: string };
}

interface PatientInfo {
  name: string;
  email: string;
  phone: string;
  age: number | null;
  dob: string | null;
}

export async function profileFromIntakeForm(formData: IntakeFormData, patientInfo: PatientInfo): Promise<PatientProfile> {
  const transcript = `
Patient Name: ${patientInfo.name || "Unknown"}
Email: ${patientInfo.email || "N/A"}
Phone: ${patientInfo.phone || "N/A"}
Age: ${patientInfo.age || "Unknown"}
Date of Birth: ${patientInfo.dob || "Unknown"}
Primary Concern: ${formData.basicInfo?.primaryConcern || "Not specified"}

TIMELINE DATA:
${JSON.stringify(formData.timeline || {}, null, 2)}

ENVIRONMENTAL EXPOSURES:
Mold Exposure: ${formData.environmental?.moldExposure || "Unknown"}
Heavy Metals: ${JSON.stringify(formData.environmental?.heavyMetals || {})}
Chemical Exposure: ${formData.environmental?.chemicalExposure || "Unknown"}
Water Quality: ${formData.environmental?.waterQuality || "Unknown"}

TRAUMA HISTORY:
${JSON.stringify(formData.trauma || {}, null, 2)}

SYMPTOMS:
${JSON.stringify(formData.symptoms || {}, null, 2)}

SURGICAL HISTORY:
${JSON.stringify(formData.surgical || {}, null, 2)}

LIFESTYLE:
Diet: ${formData.lifestyle?.dietType || "Unknown"}
Exercise: ${formData.lifestyle?.exerciseFrequency || "Unknown"}
Sleep Hours: ${formData.lifestyle?.sleepHours || "Unknown"}
Stress Level: ${formData.lifestyle?.stressLevel || "Unknown"}
${JSON.stringify(formData.lifestyle || {}, null, 2)}
`;

  return analyzeTranscript(transcript);
}

export async function generateProtocolSlides(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<{ presentationId: string; webViewLink: string }> {
  try {
    const slides = await getUncachableSlidesClient();

    const createRes = await slides.presentations.create({
      requestBody: {
        title: `${protocol.patientName} - Healing Protocol ${protocol.generatedDate}`,
      },
    });

    const presentationId = createRes.data.presentationId!;
    const initialSlideId = createRes.data.slides?.[0]?.objectId;

    const slideRequests = buildSlideRequests(protocol, profile);

    if (initialSlideId) {
      slideRequests.push({ deleteObject: { objectId: initialSlideId } });
    }

    if (slideRequests.length > 0) {
      await slides.presentations.batchUpdate({
        presentationId,
        requestBody: { requests: slideRequests },
      });
    }

    return {
      presentationId,
      webViewLink: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Protocol Assembly] Failed to generate slides:", error);
    throw new Error(`Failed to generate slides: ${message}`);
  }
}

function buildSlideRequests(protocol: HealingProtocol, profile: PatientProfile): Record<string, unknown>[] {
  const requests: Record<string, unknown>[] = [];
  let slideIndex = 0;

  function addSlide(layoutId?: string) {
    const slideId = `slide_${slideIndex}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: slideIndex,
        slideLayoutReference: layoutId ? { layoutId } : { predefinedLayout: "BLANK" },
      },
    });
    slideIndex++;
    return slideId;
  }

  function addTextBox(slideId: string, text: string, x: number, y: number, w: number, h: number, fontSize: number = 14, bold: boolean = false, color?: { red: number; green: number; blue: number }) {
    const boxId = `${slideId}_text_${requests.length}`;
    requests.push({
      createShape: {
        objectId: boxId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: w, unit: "PT" },
            height: { magnitude: h, unit: "PT" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: "PT",
          },
        },
      },
    });
    requests.push({
      insertText: {
        objectId: boxId,
        text,
      },
    });
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          fontSize: { magnitude: fontSize, unit: "PT" },
          bold,
          ...(color ? { foregroundColor: { opaqueColor: { rgbColor: color } } } : {}),
        },
        textRange: { type: "ALL" },
        fields: `fontSize,bold${color ? ",foregroundColor" : ""}`,
      },
    });
    return boxId;
  }

  const titleSlide = addSlide();
  addTextBox(titleSlide, protocol.patientName, 50, 120, 620, 80, 36, true, { red: 0.2, green: 0.1, blue: 0.5 });
  addTextBox(titleSlide, `Healing Protocol | ${protocol.generatedDate}`, 50, 210, 620, 40, 18, false, { red: 0.4, green: 0.3, blue: 0.6 });
  addTextBox(titleSlide, "Forgotten Formula PMA", 50, 320, 620, 30, 14, false, { red: 0.5, green: 0.5, blue: 0.5 });

  const overviewSlide = addSlide();
  addTextBox(overviewSlide, "Patient Overview", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
  const overviewText = [
    `Name: ${protocol.patientName}`,
    `Age: ${protocol.patientAge}`,
    `Gender: ${profile.gender || "N/A"}`,
    `Location: ${profile.location || "N/A"}`,
    "",
    "Chief Complaints:",
    ...profile.chiefComplaints.map((c) => `• ${c}`),
    "",
    "Current Diagnoses:",
    ...profile.currentDiagnoses.map((d) => `• ${d}`),
    "",
    "Goals:",
    ...profile.goals.map((g) => `• ${g}`),
  ].join("\n");
  addTextBox(overviewSlide, overviewText, 30, 70, 660, 400, 12);

  if (profile.medicalTimeline && profile.medicalTimeline.length > 0) {
    const timelineSlide = addSlide();
    addTextBox(timelineSlide, "Medical Timeline", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const timelineText = profile.medicalTimeline
      .map((e) => `${e.ageRange}${e.year ? ` (${e.year})` : ""}: ${e.event}\n   → ${e.significance}`)
      .join("\n\n");
    addTextBox(timelineSlide, timelineText, 30, 70, 660, 400, 11);
  }

  if (protocol.rootCauseAnalysis && protocol.rootCauseAnalysis.length > 0) {
    const rcSlide = addSlide();
    addTextBox(rcSlide, "Root Cause Analysis", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const rcText = protocol.rootCauseAnalysis
      .map(
        (rc) =>
          `${rc.rank}. ${rc.cause} (${rc.category.toUpperCase()})\n   ${rc.details}\n   Related: ${rc.relatedSymptoms.join(", ")}`
      )
      .join("\n\n");
    addTextBox(rcSlide, rcText, 30, 70, 660, 400, 12);
  }

  if (protocol.phases && protocol.phases.length > 0) {
    const phaseSlide = addSlide();
    addTextBox(phaseSlide, "Treatment Phases", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const phaseText = protocol.phases
      .map(
        (p) =>
          `Phase ${p.phaseNumber}: ${p.name} (${p.weekRange})\nFocus: ${p.focus}\n${p.keyActions.map((a) => `• ${a}`).join("\n")}`
      )
      .join("\n\n");
    addTextBox(phaseSlide, phaseText, 30, 70, 660, 400, 11);
  }

  if (protocol.dailySchedule) {
    const schedSlide = addSlide();
    addTextBox(schedSlide, "Daily Schedule", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const schedParts = [];
    for (const [period, items] of Object.entries(protocol.dailySchedule)) {
      if (items && items.length > 0) {
        schedParts.push(
          `${period.toUpperCase()}:\n${(items as Array<{item: string; details?: string}>).map((i) => `• ${i.item}${i.details ? ` — ${i.details}` : ""}`).join("\n")}`
        );
      }
    }
    addTextBox(schedSlide, schedParts.join("\n\n"), 30, 70, 660, 400, 10);
  }

  if (protocol.injectablePeptides && protocol.injectablePeptides.length > 0) {
    const pepSlide = addSlide();
    addTextBox(pepSlide, "Injectable Peptide Protocol", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const pepText = protocol.injectablePeptides
      .map(
        (p) =>
          `${p.name}\n  Vial: ${p.vialSize} | Recon: ${p.reconstitution}\n  Dose: ${p.dose} ${p.route} ${p.frequency}\n  Duration: ${p.duration} | Purpose: ${p.purpose}`
      )
      .join("\n\n");
    addTextBox(pepSlide, pepText, 30, 70, 660, 400, 10);
  }

  if (protocol.supplements && protocol.supplements.length > 0) {
    const suppSlide = addSlide();
    addTextBox(suppSlide, "Supplement Stack", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const suppText = protocol.supplements
      .map((s) => `• ${s.name} — ${s.dose} (${s.timing}) → ${s.purpose}`)
      .join("\n");
    addTextBox(suppSlide, suppText, 30, 70, 660, 400, 11);
  }

  if (protocol.detoxProtocols && protocol.detoxProtocols.length > 0) {
    const detoxSlide = addSlide();
    addTextBox(detoxSlide, "Detox Protocols", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const detoxText = protocol.detoxProtocols
      .map(
        (d) =>
          `${d.name}\n  Method: ${d.method}\n  Frequency: ${d.frequency} | Duration: ${d.duration}\n  ${d.instructions}`
      )
      .join("\n\n");
    addTextBox(detoxSlide, detoxText, 30, 70, 660, 400, 11);
  }

  if (
    protocol.parasiteAntiviralProtocols &&
    protocol.parasiteAntiviralProtocols.length > 0
  ) {
    const paraSlide = addSlide();
    addTextBox(paraSlide, "Parasite & Antiviral Protocols", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const paraText = protocol.parasiteAntiviralProtocols
      .map(
        (p) =>
          `${p.name}: ${p.dose}\n  Schedule: ${p.schedule} | Duration: ${p.duration}\n  Purpose: ${p.purpose}`
      )
      .join("\n\n");
    addTextBox(paraSlide, paraText, 30, 70, 660, 400, 11);
  }

  if (
    protocol.lifestyleRecommendations &&
    protocol.lifestyleRecommendations.length > 0
  ) {
    const lifeSlide = addSlide();
    addTextBox(lifeSlide, "Lifestyle & Diet", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const lifeText = [
      ...protocol.lifestyleRecommendations.map(
        (l) => `${l.category}: ${l.recommendation}${l.details ? `\n  ${l.details}` : ""}`
      ),
      "",
      "DIETARY GUIDELINES:",
      ...(protocol.dietaryGuidelines || []).map((d) => `• ${d}`),
    ].join("\n");
    addTextBox(lifeSlide, lifeText, 30, 70, 660, 400, 11);
  }

  if (protocol.followUpPlan && protocol.followUpPlan.length > 0) {
    const fuSlide = addSlide();
    addTextBox(fuSlide, "Follow-Up Plan", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
    const fuText = [
      ...protocol.followUpPlan.map(
        (f) => `Week ${f.weekNumber}: ${f.action}${f.details ? ` — ${f.details}` : ""}`
      ),
      "",
      "REQUIRED LABS:",
      ...(protocol.labsRequired || []).map((l) => `• ${l}`),
    ].join("\n");
    addTextBox(fuSlide, fuText, 30, 70, 660, 400, 12);
  }

  return requests;
}

export async function saveProtocol(
  profile: PatientProfile,
  protocol: HealingProtocol,
  sourceType: "transcript" | "intake_form",
  generatedBy?: string,
  memberId?: string,
  doctorId?: string
): Promise<number> {
  const [result] = await db
    .insert(generatedProtocols)
    .values({
      patientName: protocol.patientName,
      patientAge: protocol.patientAge,
      sourceType,
      intakeFormId: profile.intakeFormId || null,
      memberId: memberId || null,
      doctorId: doctorId || null,
      patientProfile: profile as unknown as Record<string, unknown>,
      protocol: protocol as unknown as Record<string, unknown>,
      status: "draft",
      generatedBy: generatedBy || "system",
    })
    .returning({ id: generatedProtocols.id });

  return result.id;
}

export async function updateProtocolSlides(
  protocolId: number,
  presentationId: string,
  webViewLink: string
) {
  await db
    .update(generatedProtocols)
    .set({
      slidesPresentationId: presentationId,
      slidesWebViewLink: webViewLink,
      updatedAt: new Date(),
    })
    .where(eq(generatedProtocols.id, protocolId));
}

export async function getProtocol(id: number): Promise<GeneratedProtocol | null> {
  const [protocol] = await db
    .select()
    .from(generatedProtocols)
    .where(eq(generatedProtocols.id, id));
  return protocol || null;
}

export async function listProtocols(limit: number = 50) {
  return db
    .select({
      id: generatedProtocols.id,
      patientName: generatedProtocols.patientName,
      patientAge: generatedProtocols.patientAge,
      sourceType: generatedProtocols.sourceType,
      memberId: generatedProtocols.memberId,
      doctorId: generatedProtocols.doctorId,
      status: generatedProtocols.status,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
      dailySchedulePdfFileId: generatedProtocols.dailySchedulePdfFileId,
      dailySchedulePdfWebViewLink: generatedProtocols.dailySchedulePdfWebViewLink,
      peptideSchedulePdfFileId: generatedProtocols.peptideSchedulePdfFileId,
      peptideSchedulePdfWebViewLink: generatedProtocols.peptideSchedulePdfWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      reviewedBy: generatedProtocols.reviewedBy,
      reviewedAt: generatedProtocols.reviewedAt,
      reviewNotes: generatedProtocols.reviewNotes,
      createdAt: generatedProtocols.createdAt,
      updatedAt: generatedProtocols.updatedAt,
    })
    .from(generatedProtocols)
    .orderBy(desc(generatedProtocols.createdAt))
    .limit(limit);
}
