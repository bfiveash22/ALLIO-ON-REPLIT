import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { db } from "../db";
import { vitalityAssessments } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const ratingSchema = z.number().int().min(0).max(5).optional().default(0);

const sectionSchema = z.object({}).catchall(ratingSchema).optional().default({});

const createAssessmentSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  memberName: z.string().optional().default(""),
  cellularHealth: sectionSchema,
  detox: sectionSchema,
  systemicHealth: sectionSchema,
  dietNutrition: sectionSchema,
  environmental: sectionSchema,
  stressEmotional: sectionSchema,
  physicalActivity: sectionSchema,
  notes: z.string().optional().default(""),
});

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user) return false;
  const roles = Array.isArray(user.wpRoles) ? user.wpRoles : [];
  return roles.includes("administrator");
}

function getDoctorId(req: Request): string {
  return (req as any).user?.id as string;
}

export function registerVitalityRoutes(app: Express): void {
  app.post("/api/vitality/assessments", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const parsed = createAssessmentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || "Invalid input" });
        return;
      }

      const doctorId = getDoctorId(req);
      const data = parsed.data;
      const scores = computeScores(data);
      const recommendations = generateRecommendations(scores);

      const [assessment] = await db.insert(vitalityAssessments).values({
        memberId: data.memberId,
        memberName: data.memberName || null,
        doctorId,
        status: "completed",
        overallScore: scores.overall,
        cellularHealthScore: scores.cellularHealth,
        detoxScore: scores.detox,
        systemicHealthScore: scores.systemicHealth,
        dietNutritionScore: scores.dietNutrition,
        environmentalScore: scores.environmental,
        stressEmotionalScore: scores.stressEmotional,
        physicalActivityScore: scores.physicalActivity,
        cellularHealthData: data.cellularHealth || {},
        detoxData: data.detox || {},
        systemicHealthData: data.systemicHealth || {},
        dietNutritionData: data.dietNutrition || {},
        environmentalData: data.environmental || {},
        stressEmotionalData: data.stressEmotional || {},
        physicalActivityData: data.physicalActivity || {},
        recommendations,
        notes: data.notes || null,
      }).returning();

      res.json({ success: true, assessment });
    } catch (error: any) {
      console.error("Create vitality assessment error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/vitality/assessments", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = getDoctorId(req);
      const memberId = req.query.memberId as string | undefined;
      const admin = isAdmin(req);

      let conditions = admin ? undefined : eq(vitalityAssessments.doctorId, doctorId);
      if (memberId) {
        const memberCondition = eq(vitalityAssessments.memberId, memberId);
        conditions = conditions ? and(conditions, memberCondition)! : memberCondition;
      }

      const assessments = await db.select()
        .from(vitalityAssessments)
        .where(conditions)
        .orderBy(desc(vitalityAssessments.createdAt));

      res.json({ success: true, assessments });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/vitality/assessments/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = getDoctorId(req);
      const admin = isAdmin(req);

      const conditions = admin
        ? eq(vitalityAssessments.id, req.params.id)
        : and(eq(vitalityAssessments.id, req.params.id), eq(vitalityAssessments.doctorId, doctorId))!;

      const [assessment] = await db.select()
        .from(vitalityAssessments)
        .where(conditions);

      if (!assessment) {
        res.status(404).json({ success: false, error: "Assessment not found" });
        return;
      }

      res.json({ success: true, assessment });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/vitality/member/:memberId/history", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = getDoctorId(req);
      const admin = isAdmin(req);

      const conditions = admin
        ? eq(vitalityAssessments.memberId, req.params.memberId)
        : and(eq(vitalityAssessments.memberId, req.params.memberId), eq(vitalityAssessments.doctorId, doctorId))!;

      const assessments = await db.select()
        .from(vitalityAssessments)
        .where(conditions)
        .orderBy(desc(vitalityAssessments.createdAt));

      res.json({ success: true, assessments });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/vitality/assessments/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = getDoctorId(req);
      const admin = isAdmin(req);

      const conditions = admin
        ? eq(vitalityAssessments.id, req.params.id)
        : and(eq(vitalityAssessments.id, req.params.id), eq(vitalityAssessments.doctorId, doctorId))!;

      const [existing] = await db.select({ id: vitalityAssessments.id })
        .from(vitalityAssessments)
        .where(conditions);

      if (!existing) {
        res.status(404).json({ success: false, error: "Assessment not found" });
        return;
      }

      await db.delete(vitalityAssessments).where(eq(vitalityAssessments.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

function scoreFromRating(rating: number | undefined, max: number = 5): number {
  if (!rating || rating < 1) return 0;
  const clamped = Math.min(Math.max(rating, 1), max);
  return Math.round((clamped / max) * 100);
}

function averageScores(scores: number[]): number {
  const valid = scores.filter(s => s > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function computeScores(data: any) {
  const ch = data.cellularHealth || {};
  const cellularHealth = averageScores([
    scoreFromRating(ch.telomereLength),
    scoreFromRating(ch.mitochondrialFunction),
    scoreFromRating(ch.oxidativeStress),
    scoreFromRating(ch.cellMembraneIntegrity),
    scoreFromRating(ch.dnaRepairCapacity),
  ]);

  const dx = data.detox || {};
  const detox = averageScores([
    scoreFromRating(dx.liverFunction),
    scoreFromRating(dx.kidneyFunction),
    scoreFromRating(dx.lymphaticFlow),
    scoreFromRating(dx.glutathioneLevels),
    scoreFromRating(dx.heavyMetalBurden),
  ]);

  const sh = data.systemicHealth || {};
  const systemicHealth = averageScores([
    scoreFromRating(sh.inflammationMarkers),
    scoreFromRating(sh.immuneFunction),
    scoreFromRating(sh.hormonalBalance),
    scoreFromRating(sh.gutHealth),
    scoreFromRating(sh.cardiovascularHealth),
  ]);

  const dn = data.dietNutrition || {};
  const dietNutrition = averageScores([
    scoreFromRating(dn.wholeFood),
    scoreFromRating(dn.hydration),
    scoreFromRating(dn.micronutrients),
    scoreFromRating(dn.processedFoodAvoidance),
    scoreFromRating(dn.mealTiming),
  ]);

  const env = data.environmental || {};
  const environmental = averageScores([
    scoreFromRating(env.airQuality),
    scoreFromRating(env.waterQuality),
    scoreFromRating(env.toxinExposure),
    scoreFromRating(env.emfExposure),
    scoreFromRating(env.naturalLightExposure),
  ]);

  const se = data.stressEmotional || {};
  const stressEmotional = averageScores([
    scoreFromRating(se.perceivedStress),
    scoreFromRating(se.sleepQuality),
    scoreFromRating(se.emotionalResilience),
    scoreFromRating(se.socialConnections),
    scoreFromRating(se.mindfulnessPractice),
  ]);

  const pa = data.physicalActivity || {};
  const physicalActivity = averageScores([
    scoreFromRating(pa.aerobicExercise),
    scoreFromRating(pa.strengthTraining),
    scoreFromRating(pa.flexibility),
    scoreFromRating(pa.dailyMovement),
    scoreFromRating(pa.recoveryPractices),
  ]);

  const sectionScores = [cellularHealth, detox, systemicHealth, dietNutrition, environmental, stressEmotional, physicalActivity];
  const overall = averageScores(sectionScores);

  return { overall, cellularHealth, detox, systemicHealth, dietNutrition, environmental, stressEmotional, physicalActivity };
}

interface Recommendation {
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  protocolLink?: string;
}

function generateRecommendations(scores: ReturnType<typeof computeScores>): Recommendation[] {
  const recs: Recommendation[] = [];

  if (scores.cellularHealth < 60) {
    recs.push({
      category: "Cellular Health",
      priority: scores.cellularHealth < 40 ? "high" : "medium",
      title: "Cellular Regeneration Protocol",
      description: "Focus on mitochondrial support with CoQ10, PQQ, and NAD+ precursors. Consider peptide therapy with Epitalon for telomere support.",
      protocolLink: "/protocols",
    });
  }

  if (scores.detox < 60) {
    recs.push({
      category: "Detoxification",
      priority: scores.detox < 40 ? "high" : "medium",
      title: "Comprehensive Detox Protocol",
      description: "Implement liver/gallbladder cleanse, glutathione IV therapy, and infrared sauna sessions. Consider heavy metal chelation if indicated.",
      protocolLink: "/resources/protocol-builder",
    });
  }

  if (scores.systemicHealth < 60) {
    recs.push({
      category: "Systemic Health",
      priority: scores.systemicHealth < 40 ? "high" : "medium",
      title: "Systemic Inflammation Reduction",
      description: "Address gut health with the 5R protocol. Evaluate hormonal balance and implement anti-inflammatory nutrition plan.",
      protocolLink: "/protocols",
    });
  }

  if (scores.dietNutrition < 60) {
    recs.push({
      category: "Diet & Nutrition",
      priority: scores.dietNutrition < 40 ? "high" : "medium",
      title: "Nutritional Optimization Plan",
      description: "Transition to whole food, organic diet. Address micronutrient deficiencies with targeted supplementation. Implement intermittent fasting.",
      protocolLink: "/protocols",
    });
  }

  if (scores.environmental < 60) {
    recs.push({
      category: "Environmental",
      priority: scores.environmental < 40 ? "high" : "medium",
      title: "Environmental Toxin Reduction",
      description: "Assess home and work environment for mold, heavy metals, and EMF exposure. Implement water filtration and air purification strategies.",
      protocolLink: "/resources/ecs-tool",
    });
  }

  if (scores.stressEmotional < 60) {
    recs.push({
      category: "Stress & Emotional",
      priority: scores.stressEmotional < 40 ? "high" : "medium",
      title: "Stress Management Protocol",
      description: "Implement daily meditation, breathing exercises, and sleep hygiene optimization. Consider adaptogenic herbs and frequency therapy.",
      protocolLink: "/frequency-library",
    });
  }

  if (scores.physicalActivity < 60) {
    recs.push({
      category: "Physical Activity",
      priority: scores.physicalActivity < 40 ? "high" : "medium",
      title: "Movement & Recovery Program",
      description: "Establish consistent exercise routine combining aerobic, strength, and flexibility training. Include active recovery and grounding practices.",
    });
  }

  if (recs.length === 0) {
    recs.push({
      category: "Maintenance",
      priority: "low",
      title: "Vitality Maintenance Protocol",
      description: "Excellent baseline vitality. Continue current practices and schedule quarterly reassessments to track progress.",
    });
  }

  return recs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
