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
import { callWithFallback } from "./ai-fallback";
import { sanitizePmaLanguage, sanitizeObjectStrings } from "@shared/pma-language";

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
      searchTerms.push(profile.chiefComplaints.slice(0, 2).join(" ") + " wellness protocol");
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
          "Protocol citation for member protocol generation"
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
  const sanitizedProtocol = sanitizeObjectStrings(protocol);
  return generateProtocolPDF(sanitizedProtocol, profile, citations);
}

export async function generateDailySchedulePDFBuffer(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  const sanitizedProtocol = sanitizeObjectStrings(protocol);
  return generateDailySchedulePDF(sanitizedProtocol, profile);
}

export async function generatePeptideSchedulePDFBuffer(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  const sanitizedProtocol = sanitizeObjectStrings(protocol);
  return generatePeptideSchedulePDF(sanitizedProtocol, profile);
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
        content: `You are a clinical data extraction expert for Forgotten Formula PMA. Analyze the call transcript and extract a structured member profile.

Extract ALL of the following into valid JSON matching the PatientProfile interface:
- name, age, gender, location, callDate
- chiefComplaints: array of primary health concerns
- currentDiagnoses: array of assessed conditions
- currentMedications: array of current meds
- medicalTimeline: array of {ageRange, year?, event, significance}
- rootCauses: array of {rank (1-5), cause, category (primary/secondary/tertiary/quaternary/quinary), details, relatedSymptoms[]}
- environmentalExposures: {moldExposure, moldDetails?, heavyMetals, heavyMetalDetails?, amalgamFillings, amalgamCount?, amalgamYears?, pesticides, radiation, otherToxins?}
- traumaHistory: {childhoodTrauma, traumaDetails?, aceScore?, earlyPuberty?, significantStressors?}
- surgicalHistory: array of surgeries
- gutHealth: {gallbladderRemoved, appendixRemoved, digestiveIssues[], probioticHistory?}
- hormoneStatus: {thyroidIssues?, estrogenDominance?, hormoneDetails?}
- parasiteStatus: {everTreated, protocolDetails?}
- dentalHistory: {amalgamFillings, rootCanals, cavitations?}
- deficiencies: array of suspected deficiencies
- contraindications: array of things to avoid
- goals: array of member wellness goals

Use root-cause reasoning to identify root causes from the data. Follow the FF PMA 5 Root Causes framework:
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
  if (!content) throw new Error("Failed to extract member profile from transcript");

  const parsed = JSON.parse(content);

  const profile: PatientProfile = {
    name: parsed.name || "Unknown Member",
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

  const systemPrompt = `You are DR. FORMULA, the Forgotten Formula Protocol Architect. Given a member profile, generate a comprehensive 90-day healing protocol with FULL MODALITY COVERAGE.

${knowledgeBase}

DETOX PROTOCOLS KNOWLEDGE:
${detoxKnowledge}

PROTOCOL STRUCTURE (output as valid JSON matching HealingProtocol):
{
  "memberName": string,
  "memberAge": number,
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
  "labsRequired": [string],
  "suppositories": [{name, timing ("daytime"|"nighttime"|"as-needed"), formula, cannabinoids: {CBD?, CBG?, CBN?, THC?, DMSO?}, base, frequency, purpose, notes?}],
  "liposomals": [{name, dose, frequency, timing, purpose}],
  "exosomes": [{name, source, concentration, route, frequency, purpose, notes?}],
  "topicals": [{name, form, application, frequency, purpose}],
  "nebulization": [{name, solution, dose, frequency, duration, purpose}],
  "ecsProtocol": {
    "overview": string,
    "daytimeFormula": {CBD, CBG, CBN?, THC?, DMSO, base, deliveryMethod},
    "nighttimeFormula": {CBD, CBG?, CBN, THC, DMSO, base, deliveryMethod},
    "tincture": {name, cannabinoids[], dose, frequency},
    "targetedRatios": [{condition, ratio, rationale}],
    "ecsSupport": [string],
    "molecularTargets": [string]
  },
  "sirtuinStack": {
    "mitoSTAC": {resveratrol, pterostilbene, quercetin, fisetin},
    "nadPrecursors": {compound, dose, frequency},
    "glyNAC": {glycine, nac, frequency},
    "mitochondrialSupport": [{name, dose, purpose}],
    "methylationSupport": [{name, dose}]
  },
  "dietaryProtocol": {
    "phases": [{name, duration, focus, eliminate[], emphasize[], notes?}],
    "intermittentFasting": {protocol, schedule, purpose},
    "specialConsiderations": [string]
  }
}

ROOT-CAUSE-TO-PROTOCOL MAPPING (MANDATORY):
- Mycotoxin/Mercury exposure → Glutathione IV + EDTA chelation + clay baths + castor oil packs + infrared sauna + nebulized glutathione
- Cancer → High-dose Vitamin C IV (50-100g) + mistletoe + ozone + modified keto diet + DIM/I3C + fenbendazole + ECS suppositories (THC:CBD 1:1)
- Gut/Immune dysfunction → ECS suppository rotation + probiotics (100B+ CFU) + BPC-157 oral + L-glutamine + colostrum
- Trauma/PTSD → ECS CBD:THC 20:1 + EMDR + EFT + somatic experiencing + cortisol management
- Mold illness → Nebulized glutathione 3x/week + infrared sauna + Beyond Fasting protocol + mycotoxin binders
- Autoimmune → NAD+ IV + Myers' cocktail + LDN + ECS anti-inflammatory protocol
- Hormone disruption → Iodine + selenium + DIM + bioidentical support + ECS hormone modulation
- Parasite burden → Ivermectin + fenbendazole + black walnut/wormwood/clove + biofilm disruptors (serrapeptase, nattokinase)

MANDATORY INCLUSIONS FOR EVERY PROTOCOL:
1. ECS Protocol with daytime AND nighttime suppository formulas (CBD, CBG, CBN, THC, DMSO in cacao butter base)
2. Elixir for Everything tincture (12 non-psychoactive cannabinoids: CBD, CBG, CBC, CBDV, CBN, THCV, CBDA, CBGA, CBCA, THCA, CBDVA, CBCVA)
3. Sirtuin/MitoSTAC stack (resveratrol, pterostilbene, quercetin, fisetin)
4. GlyNAC protocol (glycine + NAC)
5. NAD+ precursors (NMN or NR)
6. Mitochondrial support (CoQ10/ubiquinol, PQQ, D-ribose, L-carnitine)
7. Comprehensive detox toolkit: clay baths, castor oil packs, infrared sauna, coffee enemas, epsom salt baths, dry brushing
8. 90 Essential Nutrients framework + targeted mineral repletion matching deficiencies
9. Liposomal supplements (glutathione, curcumin, D3/K2, astaxanthin)
10. Dietary protocol with elimination phase, anti-inflammatory phase, and condition-specific nutrition
11. Frequency healing (solfeggio 528 Hz DNA repair, 396 Hz grounding, 741 Hz detox)
12. 5R Framework phases: REMOVE, RESTORE, REPLENISH, REGENERATE, REBALANCE

RULES:
1. ONLY select therapies from the available knowledge base above
2. Include specific dosages, reconstitution instructions, and syringe sizes for peptides
3. Structure as 5 phases following the 5R Framework
4. Daily schedule must include exact products and timing (Morning 6AM / Midday 12PM / Evening 6PM / Bedtime 9:30PM)
5. Always include: comprehensive detox toolkit (not just "epsom bath"), parasite protocols, hydration guidance
6. Include MitoStac, Reds + Greens, Elixir, Bio-Vitamin, and Mighty Blue in supplement stack
7. ECS suppositories MUST be included with specific cannabinoid ratios per condition
8. Nebulization protocol when respiratory/mold issues present
9. IV therapies must be root-cause-targeted from the 16 IV protocols in catalog
10. Be clinically aggressive - these are PMA member protocols
11. Lipo-B is IM ONLY (216mg/mL total) - never list it under IV section
12. Include topicals (DMSO cream, Kaneh Bosem) when applicable

Return ONLY valid JSON, no markdown.`;

  const userPrompt = `MEMBER PROFILE:\n${JSON.stringify(profile, null, 2)}`;

  const { callWithFallback, isTerminalFailure } = await import("./ai-fallback");
  console.log("[Protocol Assembly] Generating protocol via centralized AI fallback chain with quality validation...");
  let aiResult;
  try {
    aiResult = await callWithFallback(userPrompt, {
      systemPrompt,
      preferredProvider: "abacus",
      preferredModel: "deployment:dr-formula-protocol",
      maxRetries: 1,
      maxTokens: 12000,
      callType: "protocol-generation",
      startTier: "economy",
      expectedFields: [
        "memberName", "summary", "rootCauseAnalysis", "phases",
        "dailySchedule", "injectablePeptides", "supplements",
      ],
    });
  } catch (err: any) {
    if (isTerminalFailure(err)) {
      console.error(`[Protocol Assembly] Terminal failure: ${err.message}`);
      try {
        await db.insert(generatedProtocols).values({
          patientName: profile.name || "Unknown",
          patientAge: profile.age || 0,
          sourceType: "intake_form",
          patientProfile: profile as unknown as Record<string, unknown>,
          protocol: {} as Record<string, unknown>,
          status: "ai_failed",
          generatedBy: "system",
        });
        console.log(`[Protocol Assembly] Saved failed attempt to DB for retry (member: ${profile.name || "Unknown"})`);
      } catch (dbErr) {
        console.error("[Protocol Assembly] Could not persist terminal failure to DB:", dbErr);
      }
      throw new Error(err.userMessage);
    }
    throw err;
  }
  const content = aiResult.response;
  console.log(`[Protocol Assembly] Protocol generated via ${aiResult.provider} (${aiResult.model}), quality: ${aiResult.qualityScore}/100${aiResult.fallbackUsed ? " [fallback]" : ""}${aiResult.escalationUsed ? " [escalated]" : ""}, length: ${content.length}`);

  if (!content || content.length < 100) throw new Error("Failed to generate protocol from any provider");

  const raw = JSON.parse(content);
  if (raw.memberName && !raw.patientName) {
    raw.patientName = raw.memberName;
    delete raw.memberName;
  }
  if (raw.memberAge && !raw.patientAge) {
    raw.patientAge = raw.memberAge;
    delete raw.memberAge;
  }
  const parsed = raw as HealingProtocol;

  enforceRequiredModalities(parsed, profile);

  return parsed;
}

function enforceRequiredModalities(protocol: HealingProtocol, profile: PatientProfile): void {
  const allText = JSON.stringify(profile).toLowerCase();
  const hasMold = allText.includes("mold") || allText.includes("mycotoxin");
  const hasMercury = allText.includes("mercury") || allText.includes("amalgam");
  const hasGut = (profile.gutHealth?.digestiveIssues?.length || 0) > 0 || allText.includes("gut") || allText.includes("dysbiosis");
  const hasCancer = ["cancer","tumor","carcinoma","malignant","her2","er+","pr+"].some(k => allText.includes(k));
  const hasAutoimmune = allText.includes("autoimmune") || allText.includes("lupus") || allText.includes("hashimoto");

  if (!protocol.suppositories) protocol.suppositories = [];
  if (!protocol.liposomals) protocol.liposomals = [];
  if (!protocol.exosomes) protocol.exosomes = [];
  if (!protocol.topicals) protocol.topicals = [];
  if (!protocol.nebulization) protocol.nebulization = [];

  if (!protocol.ecsProtocol) {
    protocol.ecsProtocol = {
      overview: "ECS optimization protocol — mandatory for all FF PMA members",
      daytimeFormula: { CBD: "25-50mg", CBG: "10-25mg", DMSO: "5-10%", base: "cacao butter", deliveryMethod: "suppository" },
      nighttimeFormula: { CBD: "50-100mg", CBN: "10-20mg", THC: "10-25mg", DMSO: "5-10%", base: "cacao butter", deliveryMethod: "suppository" },
      tincture: { name: "Elixir for Everything", cannabinoids: ["CBD","CBG","CBC","CBDV","CBN","THCV","CBDA","CBGA","CBCA","THCA","CBDVA","CBCVA"], dose: "1-2 mL", frequency: "2x daily sublingual" },
      targetedRatios: [],
      ecsSupport: ["Omega-3 fatty acids 2-4g EPA/DHA daily","PEA 600mg 2x daily","Dark chocolate 85%+ cacao"],
      molecularTargets: [],
    };
    console.log("[Protocol Enforcer] Injected default ECS protocol");
  }
  if (!protocol.sirtuinStack) {
    protocol.sirtuinStack = {
      mitoSTAC: { resveratrol: "500mg daily", pterostilbene: "100mg daily", quercetin: "500mg 2x daily", fisetin: "100mg daily" },
      nadPrecursors: { compound: "NMN", dose: "500-1000mg daily", frequency: "Morning" },
      glyNAC: { glycine: "2-3g 2x daily", nac: "600mg 2x daily", frequency: "Morning and evening" },
      mitochondrialSupport: [
        { name: "CoQ10 (Ubiquinol)", dose: "200-400mg daily", purpose: "Electron transport chain, ATP production" },
        { name: "PQQ", dose: "20mg daily", purpose: "Mitochondrial biogenesis" },
        { name: "D-Ribose", dose: "5g 2x daily", purpose: "ATP precursor" },
        { name: "L-Carnitine", dose: "1000-2000mg daily", purpose: "Fatty acid transport into mitochondria" },
      ],
      methylationSupport: [
        { name: "TMG", dose: "500-1000mg daily" },
        { name: "Methylfolate", dose: "1000mcg daily" },
        { name: "Methylcobalamin", dose: "1000-5000mcg daily" },
      ],
    };
    console.log("[Protocol Enforcer] Injected sirtuin/MitoSTAC stack");
  }
  if (!protocol.dietaryProtocol) {
    protocol.dietaryProtocol = {
      phases: [
        { name: "Phase 1: Elimination", duration: "Weeks 1-3", focus: "Remove inflammatory triggers", eliminate: ["Gluten","Dairy","Sugar","Processed foods","Alcohol","Caffeine"], emphasize: ["Organic vegetables","Wild-caught fish","Bone broth","Healthy fats"] },
        { name: "Phase 2: Anti-Inflammatory", duration: "Weeks 3-8", focus: "Reduce systemic inflammation", eliminate: ["Refined carbohydrates","Seed oils","Nightshades if sensitive"], emphasize: ["Cruciferous vegetables","Fermented foods","Omega-3 rich foods","Turmeric/ginger"] },
        { name: "Phase 3: Condition-Specific", duration: "Weeks 8+", focus: "Targeted nutrition for primary condition", eliminate: [], emphasize: ["Condition-specific nutrition"] },
      ],
      intermittentFasting: { protocol: "16:8", schedule: "Eat 12pm-8pm, fast 8pm-12pm", purpose: "Autophagy, cellular cleanup, immune optimization" },
      specialConsiderations: [],
    };
    console.log("[Protocol Enforcer] Injected 3-phase dietary protocol");
  }

  if (!protocol.liposomals.length) {
    protocol.liposomals = [
      { name: "Liposomal Glutathione", dose: "500mg", frequency: "Daily", timing: "Morning empty stomach", purpose: "Master antioxidant, detoxification support" },
      { name: "Liposomal Curcumin", dose: "500mg", frequency: "2x daily", timing: "With meals", purpose: "Anti-inflammatory, NF-kB inhibition" },
      { name: "Liposomal D3/K2", dose: "5000 IU D3 + 200mcg K2", frequency: "Daily", timing: "With fat-containing meal", purpose: "Immune modulation, calcium metabolism" },
      { name: "Liposomal Astaxanthin", dose: "12mg", frequency: "Daily", timing: "With meals", purpose: "Mitochondrial protection, antioxidant" },
    ];
    console.log("[Protocol Enforcer] Injected liposomal supplements");
  }

  if (hasMold && !protocol.nebulization.length) {
    protocol.nebulization = [
      { name: "Nebulized Glutathione", solution: "200mg in 3mL saline", dose: "200mg", frequency: "3x weekly", duration: "10-15 minutes", purpose: "Mycotoxin clearance from respiratory system" },
      { name: "Nebulized Hydrogen Peroxide", solution: "0.04% food-grade H2O2 in saline", dose: "3mL", frequency: "2x weekly", duration: "10 minutes", purpose: "Antimicrobial respiratory support" },
    ];
    console.log("[Protocol Enforcer] Injected nebulization for mold exposure");
  }

  if (hasMercury && !protocol.detoxProtocols?.some(d => d.name?.toLowerCase().includes("chelat") || d.instructions?.toLowerCase().includes("edta"))) {
    if (!protocol.detoxProtocols) protocol.detoxProtocols = [];
    protocol.detoxProtocols.push({
      name: "EDTA Chelation Protocol",
      method: "IV Chelation",
      frequency: "Weekly during Phase 1-2",
      duration: "8-12 sessions",
      instructions: "EDTA IV chelation — must be administered at clinic. Pre-session with glutathione IV. Monitor kidney function and mineral levels throughout."
    });
    console.log("[Protocol Enforcer] Injected EDTA chelation for mercury exposure");
  }

  if (hasCancer && !protocol.ivTherapies?.some(iv => iv.name?.toLowerCase().includes("vitamin c"))) {
    if (!protocol.ivTherapies) protocol.ivTherapies = [];
    protocol.ivTherapies.push({
      name: "High-Dose Vitamin C IV",
      frequency: "2-3x weekly",
      duration: "Throughout protocol",
      purpose: "Pro-oxidant cancer cell targeting at pharmacological doses",
      notes: "Start 25g, titrate to 50-100g based on G6PD status. Requires G6PD test before first infusion."
    });
    console.log("[Protocol Enforcer] Injected high-dose Vitamin C IV for cancer");
  }

  if (hasAutoimmune && !protocol.ivTherapies?.some(iv => iv.name?.toLowerCase().includes("nad"))) {
    if (!protocol.ivTherapies) protocol.ivTherapies = [];
    protocol.ivTherapies.push({
      name: "NAD+ IV Therapy",
      frequency: "Weekly x 4, then biweekly",
      duration: "Initial 4-week loading, then maintenance",
      purpose: "Sirtuin activation, immune modulation, cellular repair"
    });
    console.log("[Protocol Enforcer] Injected NAD+ IV for autoimmune condition");
  }

  if (hasGut && !protocol.oralPeptides?.some(p => p.name?.toLowerCase().includes("bpc"))) {
    if (!protocol.oralPeptides) protocol.oralPeptides = [];
    protocol.oralPeptides.push({
      name: "BPC-157 (oral)",
      dose: "500mcg",
      frequency: "2x daily on empty stomach",
      duration: "8-12 weeks",
      purpose: "Gut lining repair, mucosal healing, angiogenesis"
    });
    console.log("[Protocol Enforcer] Injected oral BPC-157 for gut issues");
  }

  if (protocol.suppositories.length === 0) {
    protocol.suppositories = [
      {
        name: "FF PMA Daytime ECS Formula",
        timing: "daytime",
        formula: "CBD 25-50mg + CBG 10-25mg + CBN 5-10mg + DMSO 5-10%",
        cannabinoids: { CBD: "25-50mg", CBG: "10-25mg", CBN: "5-10mg", DMSO: "5-10%" },
        base: "cacao butter",
        frequency: "Daily upon waking",
        purpose: "Daytime ECS optimization, anti-inflammatory CB2 activation",
      },
      {
        name: "FF PMA Nighttime ECS Formula",
        timing: "nighttime",
        formula: "CBD 50-100mg + THC 10-25mg + CBN 10-20mg + DMSO 5-10%",
        cannabinoids: { CBD: "50-100mg", THC: "10-25mg", CBN: "10-20mg", DMSO: "5-10%" },
        base: "cacao butter",
        frequency: "Nightly before bed",
        purpose: "Sleep, immune activation, overnight cellular repair",
      },
    ];
    console.log("[Protocol Enforcer] Injected ECS suppositories");
  }

  const ivLipoB = protocol.ivTherapies?.filter(iv =>
    iv.name?.toLowerCase().includes("lipo-b") || iv.name?.toLowerCase().includes("lipo b")
  ) || [];
  if (ivLipoB.length > 0) {
    protocol.ivTherapies = protocol.ivTherapies?.filter(iv =>
      !iv.name?.toLowerCase().includes("lipo-b") && !iv.name?.toLowerCase().includes("lipo b")
    ) || [];
    if (!protocol.imTherapies) protocol.imTherapies = [];
    ivLipoB.forEach(lb => {
      protocol.imTherapies!.push({
        name: lb.name,
        dose: "1mL (216mg total)",
        frequency: lb.frequency,
        purpose: lb.purpose
      });
    });
    console.log("[Protocol Enforcer] Moved Lipo-B from IV to IM section");
  }
}

import {
  peptides as knowledgePeptides,
  ivTherapies as knowledgeIV,
  imTherapies as knowledgeIM,
  bioregulators as knowledgeBioregulators,
  oralPeptides as knowledgeOralPeptides,
  suppositories as knowledgeSuppositories,
  supplements as knowledgeSupplements,
  exosomes as knowledgeExosomes,
  topicals as knowledgeTopicals,
} from "../protocol-knowledge";

const CATALOG_PRODUCTS: string[] = [
  ...knowledgePeptides.map(p => p.name.toLowerCase()),
  ...knowledgeIV.map(p => p.name.toLowerCase()),
  ...knowledgeIM.map(p => p.name.toLowerCase()),
  ...knowledgeBioregulators.map(p => p.name.toLowerCase()),
  ...knowledgeOralPeptides.map(p => p.name.toLowerCase()),
  ...knowledgeSuppositories.map(p => p.name.toLowerCase()),
  ...knowledgeSupplements.map(p => p.name.toLowerCase()),
  ...knowledgeExosomes.map(p => p.name.toLowerCase()),
  ...knowledgeTopicals.map(p => p.name.toLowerCase()),
];

const DOSING_PATTERNS: Record<string, RegExp> = {
  "bpc-157": /\d+\s*(mcg|µg|ug)/i,
  "thymosin alpha-1": /\d+\s*(mg|mcg)/i,
  "tb-500": /\d+\s*(mg|mcg)/i,
  "kpv": /\d+\s*(mcg|µg)/i,
  "ghk-cu": /\d+\s*(mg|mcg)/i,
  "ipamorelin": /\d+\s*(mcg|µg)/i,
  "cjc-1295": /\d+\s*(mcg|µg)/i,
  "glutathione": /\d+\s*(mg|g|ml)/i,
  "vitamin c": /\d+\s*(mg|g)/i,
  "resveratrol": /\d+\s*mg/i,
  "nmn": /\d+\s*mg/i,
  "coq10": /\d+\s*mg/i,
  "cbd": /\d+\s*mg/i,
};

function runDeterministicQAChecks(
  protocol: HealingProtocol,
  profile: PatientProfile
): { issues: string[]; suggestions: string[]; catalogMatchRate: number } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const allText = JSON.stringify(profile).toLowerCase();
  const hasCancer = ["cancer","tumor","carcinoma","malignant","her2","er+","pr+"].some(k => allText.includes(k));
  const hasMold = allText.includes("mold") || allText.includes("mycotoxin");
  const hasMercury = allText.includes("mercury") || allText.includes("amalgam");
  const hasTrauma = profile.traumaHistory?.childhoodTrauma || allText.includes("trauma") || allText.includes("ptsd");
  const hasGut = (profile.gutHealth?.digestiveIssues?.length || 0) > 0 || allText.includes("gut") || allText.includes("dysbiosis");
  const hasAutoimmune = allText.includes("autoimmune") || allText.includes("lupus") || allText.includes("hashimoto");

  if (!protocol.suppositories?.length && !protocol.ecsProtocol?.daytimeFormula) {
    issues.push("Missing ECS suppository protocol — every FF PMA protocol requires ECS optimization");
  }
  if (!protocol.sirtuinStack?.mitoSTAC) {
    issues.push("Missing MitoSTAC sirtuin stack — required for mitochondrial support");
  }
  if (!protocol.liposomals?.length) {
    issues.push("Missing liposomal supplements — required modality (glutathione, curcumin, D3/K2)");
  }
  if (!protocol.dietaryProtocol?.phases?.length && (protocol.dietaryGuidelines?.length || 0) < 3) {
    issues.push("Missing dietary protocol with phased approach — required for every protocol");
  }
  if (!protocol.sirtuinStack?.glyNAC) {
    issues.push("Missing GlyNAC protocol — glycine + NAC required for glutathione synthesis");
  }
  if (!protocol.sirtuinStack?.nadPrecursors) {
    issues.push("Missing NAD+ precursors (NMN/NR) — required for sirtuin activation");
  }
  if (hasCancer && !protocol.ivTherapies?.some(iv => iv.name?.toLowerCase().includes("vitamin c"))) {
    issues.push("Cancer member missing high-dose Vitamin C IV — critical for cancer protocol");
  }
  if (hasMold && !protocol.nebulization?.length) {
    issues.push("Mold exposure present but no nebulization protocol — nebulized glutathione 3x/week recommended");
  }
  if (hasAutoimmune && !protocol.ivTherapies?.some(iv => iv.name?.toLowerCase().includes("nad"))) {
    issues.push("Autoimmune condition present — NAD+ IV therapy recommended");
  }
  if (hasMercury && !protocol.detoxProtocols?.some(d => d.name?.toLowerCase().includes("chelat") || d.instructions?.toLowerCase().includes("dmsa") || d.instructions?.toLowerCase().includes("edta"))) {
    issues.push("Mercury exposure — chelation protocol (DMSA/EDTA) required in detox");
  }
  if (hasTrauma && !protocol.lifestyleRecommendations?.some(l => l.recommendation?.toLowerCase().includes("emdr") || l.recommendation?.toLowerCase().includes("eft") || l.recommendation?.toLowerCase().includes("somatic"))) {
    issues.push("Trauma history present — EMDR/EFT/somatic therapy required in lifestyle section");
  }
  if (hasGut && !protocol.oralPeptides?.some(p => p.name?.toLowerCase().includes("bpc"))) {
    issues.push("Gut issues present — oral BPC-157 required for gut lining repair");
  }
  if (!protocol.detoxProtocols?.some(d => d.name?.toLowerCase().includes("castor"))) {
    issues.push("Missing castor oil packs in detox protocols — required 3x weekly for liver area");
  }
  if (!protocol.detoxProtocols?.some(d => d.name?.toLowerCase().includes("clay") || d.name?.toLowerCase().includes("bentonite") || d.name?.toLowerCase().includes("bath"))) {
    issues.push("Missing detox baths (clay/bentonite/Epsom) in detox protocols — required for heavy metal binding");
  }
  const allDiagnoses: string[] = [...(profile.currentDiagnoses || []), ...(profile.chiefComplaints || [])];
  const hasJoint = allDiagnoses.some(d => /joint|arthrit|musculoskeletal|knee|shoulder|back pain/i.test(d));
  const hasSkin = allDiagnoses.some(d => /skin|dermat|eczema|psoriasis|wound|scar/i.test(d));
  const hasNeuro = allDiagnoses.some(d => /neuro|brain|cognitive|tbi|concussion|alzheimer|parkinson/i.test(d));
  const hasPain = allDiagnoses.some(d => /pain|fibromyalgia|inflammation|neuropath/i.test(d));
  const hasDegen = allDiagnoses.some(d => /degen|aging|stem cell|regenerat|tissue|injury/i.test(d));
  const topicalsIndicated = hasJoint || hasSkin || hasPain;
  const exosomesIndicated = hasNeuro || hasCancer || hasDegen || hasAutoimmune;

  if (topicalsIndicated && !protocol.topicals?.length) {
    issues.push("Topical-indicating condition present (joint/skin/pain) — topical protocols required");
  } else if (!protocol.topicals?.length) {
    suggestions.push("Consider topicals (DMSO cream, Kaneh Bosem) for localized support");
  }

  if (exosomesIndicated && !protocol.exosomes?.length) {
    issues.push("Exosome-indicating condition present (neuro/cancer/degenerative/autoimmune) — exosome therapy required");
  } else if (!protocol.exosomes?.length) {
    suggestions.push("Consider exosome therapy for regenerative support");
  }

  if (hasJoint && !protocol.topicals?.some(t => t.purpose?.toLowerCase().includes("joint") || t.purpose?.toLowerCase().includes("pain"))) {
    issues.push("Joint/musculoskeletal condition present — topicals must include joint-targeted application");
  }
  if (hasSkin && !protocol.topicals?.some(t => t.purpose?.toLowerCase().includes("skin") || t.purpose?.toLowerCase().includes("dermat"))) {
    issues.push("Skin condition present — topicals must include dermatological application");
  }
  if (hasNeuro && !protocol.exosomes?.some(e => e.route?.toLowerCase().includes("intranasal") || e.route?.toLowerCase().includes("iv"))) {
    issues.push("Neurological condition present — exosomes must include intranasal or IV route for CNS targeting");
  }

  for (const pep of protocol.injectablePeptides || []) {
    if (!pep.dose || pep.dose.toLowerCase().includes("full vial")) {
      issues.push(`Peptide "${pep.name}" has vague dosing ("${pep.dose}") — must specify exact mg and volume`);
    }
  }

  const allProductNames: string[] = [
    ...(protocol.injectablePeptides || []).map(p => p.name),
    ...(protocol.oralPeptides || []).map(p => p.name),
    ...(protocol.supplements || []).map(s => s.name),
    ...(protocol.ivTherapies || []).map(iv => iv.name),
    ...(protocol.imTherapies || []).map(im => im.name),
    ...(protocol.liposomals || []).map(l => l.name),
    ...(protocol.nebulization || []).map(n => n.name),
  ];

  function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  const catalogNormalized = CATALOG_PRODUCTS.map(normalizeName);

  let catalogMatches = 0;
  const nonCatalogItems: string[] = [];
  for (const productName of allProductNames) {
    const norm = normalizeName(productName);
    const exactMatch = catalogNormalized.includes(norm);
    const canonicalMatch = !exactMatch && catalogNormalized.some(cp =>
      (norm.length >= 4 && cp.startsWith(norm)) || (cp.length >= 4 && norm.startsWith(cp))
    );
    if (exactMatch || canonicalMatch) {
      catalogMatches++;
    } else {
      nonCatalogItems.push(productName);
    }
  }
  const catalogMatchRate = allProductNames.length > 0 ? Math.round((catalogMatches / allProductNames.length) * 100) : 100;
  if (catalogMatchRate < 60) {
    issues.push(`Catalog match rate ${catalogMatchRate}% is below 60% threshold — ${nonCatalogItems.length} products not in FF PMA catalog: ${nonCatalogItems.slice(0, 5).join(", ")}`);
  } else if (catalogMatchRate < 80) {
    suggestions.push(`Catalog match rate ${catalogMatchRate}% — consider replacing non-catalog items: ${nonCatalogItems.slice(0, 3).join(", ")}`);
  }

  for (const pep of protocol.injectablePeptides || []) {
    const pepLower = pep.name.toLowerCase();
    for (const [patternName, regex] of Object.entries(DOSING_PATTERNS)) {
      if (pepLower.includes(patternName) && pep.dose && !regex.test(pep.dose)) {
        suggestions.push(`"${pep.name}" dose "${pep.dose}" may not match expected format (e.g., numeric + unit)`);
        break;
      }
    }
  }

  const ivLipoB = protocol.ivTherapies?.filter(iv => iv.name?.toLowerCase().includes("lipo-b") || iv.name?.toLowerCase().includes("lipo b")) || [];
  if (ivLipoB.length > 0) {
    issues.push("Lipo-B is IM ONLY (216mg/mL) — found in IV section, must be moved to IM");
  }

  return { issues, suggestions, catalogMatchRate };
}

const PERSONA_PROMPTS = {
  HIPPOCRATES: `You are HIPPOCRATES, a clinical safety reviewer for the Forgotten Formula PMA. Your role is to review healing protocols for member safety, drug interactions, contraindications, and clinical completeness.

Review the protocol below against the member profile. Return a JSON object with:
- "issues": string[] — blocking safety/completeness problems that MUST be fixed
- "suggestions": string[] — non-blocking improvements

Focus on:
1. Drug-drug and supplement-drug interactions
2. Contraindications based on member conditions, medications, and allergies
3. Dosing safety (overdose risk, pediatric/geriatric adjustments)
4. Missing condition-specific protocols (e.g., cancer needs high-dose Vitamin C IV)
5. Route-of-administration errors (e.g., Lipo-B must be IM, never IV)
6. ECS suppository protocol presence and correctness

Return ONLY valid JSON. No markdown, no explanation.`,

  PARACELSUS: `You are PARACELSUS, a formulation and dosing specialist for the Forgotten Formula PMA. Your role is to verify that all compounds use correct dosages, routes of administration, frequencies, and formulations from the FF PMA product catalog.

Review the protocol below against the member profile. Return a JSON object with:
- "issues": string[] — blocking dosing/formulation errors that MUST be fixed
- "suggestions": string[] — non-blocking formulation improvements

Focus on:
1. Peptide dosing accuracy (exact mg, volume, concentration)
2. IV therapy dosing and infusion rates
3. Sirtuin stack completeness (MitoSTAC, GlyNAC, NAD+ precursors)
4. Liposomal supplement inclusion and dosing
5. Compound-specific route enforcement (IM vs IV vs SubQ vs oral)
6. Frequency and cycling patterns (5-on/2-off, loading phases)

Return ONLY valid JSON. No markdown, no explanation.`,

  ORACLE: `You are ORACLE, a protocol completeness and methodology auditor for the Forgotten Formula PMA. Your role is to verify the protocol follows FF PMA 2026 methodology, includes all required modalities, and maintains internal consistency.

Review the protocol below against the member profile. Return a JSON object with:
- "issues": string[] — blocking methodology violations that MUST be fixed
- "suggestions": string[] — non-blocking improvements to protocol quality

Focus on:
1. All mandatory modalities present (ECS suppositories, sirtuin stack, liposomals, dietary protocol)
2. Condition-appropriate modalities (mold→nebulization, mercury→chelation, cancer→Vitamin C IV)
3. Dietary protocol has phased approach with clear timelines
4. Detox protocols present and sequenced properly
5. Product names match FF PMA catalog
6. Internal consistency (no contradictory instructions)

Return ONLY valid JSON. No markdown, no explanation.`,
};

interface PersonaValidationResult {
  issues: string[];
  suggestions: string[];
}

async function runPersonaValidation(
  personaName: string,
  systemPrompt: string,
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<PersonaValidationResult> {
  const protocolSummary = JSON.stringify({
    memberName: protocol.patientName,
    conditions: profile.currentDiagnoses,
    concerns: profile.chiefComplaints,
    injectablePeptides: protocol.injectablePeptides?.map(p => ({ name: p.name, dose: p.dose, frequency: p.frequency })),
    oralPeptides: protocol.oralPeptides?.map(p => ({ name: p.name, dose: p.dose })),
    ivTherapies: protocol.ivTherapies?.map(iv => ({ name: iv.name, frequency: iv.frequency, duration: iv.duration })),
    imTherapies: protocol.imTherapies?.map(im => ({ name: im.name, dose: im.dose })),
    supplements: protocol.supplements?.map(s => ({ name: s.name, dose: s.dose })),
    liposomals: protocol.liposomals?.map(l => ({ name: l.name, dose: l.dose })),
    nebulization: protocol.nebulization?.map(n => ({ name: n.name, dose: n.dose })),
    suppositories: protocol.suppositories?.map(s => ({ name: s.name, timing: s.timing, formula: s.formula })),
    topicals: protocol.topicals?.map(t => ({ name: t.name })),
    ecsProtocol: protocol.ecsProtocol ? { daytime: !!protocol.ecsProtocol.daytimeFormula, nighttime: !!protocol.ecsProtocol.nighttimeFormula } : null,
    sirtuinStack: protocol.sirtuinStack ? { mitoSTAC: !!protocol.sirtuinStack.mitoSTAC, glyNAC: !!protocol.sirtuinStack.glyNAC, nadPrecursors: !!protocol.sirtuinStack.nadPrecursors } : null,
    dietaryProtocol: protocol.dietaryProtocol ? { phases: protocol.dietaryProtocol.phases?.length || 0 } : null,
    detoxProtocols: protocol.detoxProtocols?.map(d => ({ name: d.name })),
  });

  const profileSummary = JSON.stringify({
    conditions: profile.currentDiagnoses,
    concerns: profile.chiefComplaints,
    medications: profile.currentMedications,
    environmentalExposures: profile.environmentalExposures,
    gutHealth: profile.gutHealth,
    traumaHistory: profile.traumaHistory ? { childhood: profile.traumaHistory.childhoodTrauma } : null,
  });

  const prompt = `MEMBER PROFILE:\n${profileSummary}\n\nPROTOCOL:\n${protocolSummary}\n\nReview this protocol and return your validation as JSON.`;

  try {
    const result = await callWithFallback(prompt, {
      systemPrompt,
      maxTokens: 2048,
      maxRetries: 1,
    });

    const cleaned = result.response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const rawIssues = Array.isArray(parsed.issues) ? parsed.issues.filter((i): i is string => typeof i === 'string') : [];
    const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((s): s is string => typeof s === 'string') : [];
    return {
      issues: rawIssues.map(i => `${personaName}: ${i}`),
      suggestions: rawSuggestions.map(s => `${personaName}: ${s}`),
    };
  } catch (err) {
    console.warn(`[QA Agent] ${personaName} persona validation failed:`, err instanceof Error ? err.message : err);
    return { issues: [], suggestions: [`${personaName}: Persona validation unavailable — review manually`] };
  }
}

export async function validateProtocolWithAgents(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<{ valid: boolean; issues: string[]; suggestions: string[]; catalogMatchRate: number }> {
  const deterministic = runDeterministicQAChecks(protocol, profile);

  const personaResults = await Promise.allSettled([
    runPersonaValidation("HIPPOCRATES", PERSONA_PROMPTS.HIPPOCRATES, protocol, profile),
    runPersonaValidation("PARACELSUS", PERSONA_PROMPTS.PARACELSUS, protocol, profile),
    runPersonaValidation("ORACLE", PERSONA_PROMPTS.ORACLE, protocol, profile),
  ]);

  const allIssues = [...deterministic.issues];
  const allSuggestions = [...deterministic.suggestions];

  for (const result of personaResults) {
    if (result.status === "fulfilled") {
      allIssues.push(...result.value.issues);
      allSuggestions.push(...result.value.suggestions);
    }
  }

  const dedupedIssues = [...new Set(allIssues)];
  const dedupedSuggestions = [...new Set(allSuggestions)];

  console.log(`[QA Agent] Validation complete — ${dedupedIssues.length} issues, ${dedupedSuggestions.length} suggestions, catalog match: ${deterministic.catalogMatchRate}%`);

  return {
    valid: dedupedIssues.length === 0,
    issues: dedupedIssues,
    suggestions: dedupedSuggestions,
    catalogMatchRate: deterministic.catalogMatchRate,
  };
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
Member Name: ${patientInfo.name || "Unknown"}
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
  addTextBox(overviewSlide, "Member Overview", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
  const overviewText = [
    `Name: ${protocol.patientName}`,
    `Age: ${protocol.patientAge}`,
    `Gender: ${profile.gender || "N/A"}`,
    `Location: ${profile.location || "N/A"}`,
    "",
    "Chief Complaints:",
    ...profile.chiefComplaints.map((c) => `• ${c}`),
    "",
    "Current Assessments:",
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
    addTextBox(phaseSlide, "Wellness Phases", 30, 20, 660, 40, 24, true, { red: 0.2, green: 0.1, blue: 0.5 });
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
  doctorId?: string,
  status?: string
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
      status: status || "draft",
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
