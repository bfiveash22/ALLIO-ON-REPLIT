import { db } from "../db";
import { storage } from "../storage";
import {
  patientRecords,
  patientProtocols,
  labResults,
  userProgress,
  trainingModules,
} from "@shared/schema";
import { eq, and, desc, ilike } from "drizzle-orm";

export interface ECSScore {
  category: string;
  score: number;
  maxScore: number;
  status: "optimal" | "moderate" | "deficient";
}

export interface ECSProtocolSummary {
  protocolName: string;
  protocolType?: string | null;
  status?: string | null;
  ecsRelevance: string;
  products?: unknown;
}

export interface ECSLabMarker {
  testName: string;
  value: string;
  unit: string;
  status?: string | null;
  ecsCategory: string;
}

export interface ECSProfile {
  memberId: string;
  memberName: string;
  overallScore: number;
  maxScore: number;
  overallStatus: "optimal" | "moderate" | "deficient";
  categoryScores: ECSScore[];
  ecsProtocols: ECSProtocolSummary[];
  relevantLabMarkers: ECSLabMarker[];
  trainingProgress: {
    ecsModulesCompleted: number;
    ecsModulesTotal: number;
    completionPercentage: number;
  };
  recommendations: string[];
  generatedAt: string;
}

const ECS_CATEGORIES = [
  "mood",
  "sleep",
  "pain",
  "digestion",
  "immunity",
  "stress",
];

const ECS_RELEVANT_PROTOCOL_TYPES = [
  "peptide",
  "supplement",
  "lifestyle",
  "diet",
];

const ECS_LAB_KEYWORDS = [
  "cortisol",
  "serotonin",
  "dopamine",
  "melatonin",
  "gaba",
  "glutamate",
  "inflammatory",
  "crp",
  "il-6",
  "tnf",
  "vitamin d",
  "omega",
  "cbd",
  "thc",
  "anandamide",
  "2-ag",
];

function categorizeLabMarker(testName: string): string {
  const lower = testName.toLowerCase();
  if (lower.includes("cortisol") || lower.includes("stress")) return "stress";
  if (
    lower.includes("serotonin") ||
    lower.includes("dopamine") ||
    lower.includes("gaba")
  )
    return "mood";
  if (lower.includes("melatonin") || lower.includes("sleep")) return "sleep";
  if (lower.includes("inflammatory") || lower.includes("crp") || lower.includes("il-6") || lower.includes("tnf"))
    return "immunity";
  if (lower.includes("digestive") || lower.includes("gut")) return "digestion";
  return "general";
}

function isECSRelevantLab(testName: string): boolean {
  const lower = testName.toLowerCase();
  return ECS_LAB_KEYWORDS.some((kw) => lower.includes(kw));
}

function getProtocolECSRelevance(
  protocolType?: string | null,
  protocolName?: string
): string {
  const name = (protocolName || "").toLowerCase();
  if (name.includes("ecs") || name.includes("endocannabinoid"))
    return "Direct ECS modulation";
  if (name.includes("peptide")) return "Peptide-mediated ECS support";
  if (name.includes("detox")) return "Detoxification supporting ECS receptors";
  if (name.includes("anti-aging") || name.includes("longevity"))
    return "Longevity and ECS homeostasis";
  if (protocolType === "supplement") return "Nutritional ECS support";
  if (protocolType === "lifestyle") return "Lifestyle-based ECS optimization";
  if (protocolType === "diet") return "Dietary ECS support";
  return "General wellness supporting ECS balance";
}

export async function buildECSProfile(
  patientRecordId: string,
  doctorId: string,
  isAdmin: boolean = false
): Promise<ECSProfile> {
  const patient = await storage.getPatientRecord(patientRecordId);
  if (!patient) {
    throw new Error("Member record not found");
  }
  if (!isAdmin && patient.doctorId !== doctorId) {
    throw new Error("Unauthorized: patient does not belong to this doctor");
  }

  const protocols = await storage.getPatientProtocols(patientRecordId);
  const ecsProtocols: ECSProtocolSummary[] = protocols.map((p) => ({
    protocolName: p.protocolName,
    protocolType: p.protocolType,
    status: p.status,
    ecsRelevance: getProtocolECSRelevance(p.protocolType, p.protocolName),
    products: p.products,
  }));

  let relevantLabMarkers: ECSLabMarker[] = [];
  try {
    const labs = await db
      .select()
      .from(labResults)
      .where(eq(labResults.memberId, patient.memberId))
      .orderBy(desc(labResults.resultDate));

    relevantLabMarkers = labs
      .filter((l) => isECSRelevantLab(l.testName))
      .map((l) => ({
        testName: l.testName,
        value: l.value,
        unit: l.unit,
        status: l.status,
        ecsCategory: categorizeLabMarker(l.testName),
      }));
  } catch {
    relevantLabMarkers = [];
  }

  let ecsModulesCompleted = 0;
  let ecsModulesTotal = 0;
  try {
    const allModules = await db
      .select()
      .from(trainingModules)
      .where(ilike(trainingModules.title, "%ecs%"));
    ecsModulesTotal = allModules.length;

    if (ecsModulesTotal > 0) {
      const progress = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, patient.memberId),
            eq(userProgress.contentType, "module")
          )
        );
      const completedModuleIds = progress
        .filter((p) => p.completedAt !== null)
        .map((p) => p.contentId);
      ecsModulesCompleted = allModules.filter((m) =>
        completedModuleIds.includes(m.id)
      ).length;
    }
  } catch {
    ecsModulesCompleted = 0;
    ecsModulesTotal = 0;
  }

  const categoryScores: ECSScore[] = ECS_CATEGORIES.map((category) => {
    let score = 50;
    const maxScore = 100;

    const catProtocols = protocols.filter((p) => {
      const name = p.protocolName.toLowerCase();
      return (
        name.includes(category) ||
        (category === "mood" && (name.includes("anxiety") || name.includes("depression"))) ||
        (category === "pain" && (name.includes("pain") || name.includes("inflammation"))) ||
        (category === "immunity" && (name.includes("immune") || name.includes("detox")))
      );
    });

    score += catProtocols.filter((p) => p.status === "active").length * 10;
    score += catProtocols.filter((p) => p.status === "completed").length * 15;

    const catLabs = relevantLabMarkers.filter(
      (l) => l.ecsCategory === category
    );
    score += catLabs.filter((l) => l.status === "normal").length * 5;
    score -= catLabs.filter((l) => l.status === "critical_high" || l.status === "critical_low").length * 10;

    score = Math.max(0, Math.min(maxScore, score));

    const status: ECSScore["status"] =
      score >= 75 ? "optimal" : score >= 40 ? "moderate" : "deficient";

    return { category, score, maxScore, status };
  });

  const overallScore = Math.round(
    categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length
  );
  const overallStatus: ECSProfile["overallStatus"] =
    overallScore >= 75
      ? "optimal"
      : overallScore >= 40
        ? "moderate"
        : "deficient";

  const recommendations: string[] = [];

  const deficientCategories = categoryScores.filter(
    (c) => c.status === "deficient"
  );
  if (deficientCategories.length > 0) {
    recommendations.push(
      `Focus on improving ECS function in: ${deficientCategories.map((c) => c.category).join(", ")}`
    );
  }

  if (ecsModulesCompleted < ecsModulesTotal) {
    recommendations.push(
      `Complete ECS training modules (${ecsModulesCompleted}/${ecsModulesTotal} done) for better understanding`
    );
  }

  const activeProtocolCount = protocols.filter(
    (p) => p.status === "active"
  ).length;
  if (activeProtocolCount === 0) {
    recommendations.push(
      "Consider starting a new ECS-focused protocol to improve balance"
    );
  }

  if (relevantLabMarkers.length === 0) {
    recommendations.push(
      "Order ECS-related lab panels (cortisol, inflammatory markers, neurotransmitters) for baseline data"
    );
  }

  const lowCompliance = protocols.filter(
    (p) =>
      p.status === "active" &&
      p.complianceScore !== null &&
      p.complianceScore !== undefined &&
      p.complianceScore < 70
  );
  if (lowCompliance.length > 0) {
    recommendations.push(
      `Improve compliance on: ${lowCompliance.map((p) => p.protocolName).join(", ")}`
    );
  }

  return {
    memberId: patient.memberId,
    memberName: patient.memberName,
    overallScore,
    maxScore: 100,
    overallStatus,
    categoryScores,
    ecsProtocols,
    relevantLabMarkers,
    trainingProgress: {
      ecsModulesCompleted,
      ecsModulesTotal,
      completionPercentage:
        ecsModulesTotal > 0
          ? Math.round((ecsModulesCompleted / ecsModulesTotal) * 100)
          : 0,
    },
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
