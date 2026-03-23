import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { doctorProspects, doctorProspectStageEnum, type DoctorProspect } from "@shared/schema";
import { randomBytes } from "crypto";

const VALID_STAGES = doctorProspectStageEnum.enumValues;
type Stage = typeof VALID_STAGES[number];

function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}

export function registerRecruitmentRoutes(app: Express): void {
  app.get("/api/recruitment/prospects", requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const stageParam = req.query.stage as string | undefined;
      if (stageParam && stageParam !== "all") {
        if (!(VALID_STAGES as readonly string[]).includes(stageParam)) {
          return res.status(400).json({ success: false, error: "Invalid stage value" });
        }
        const stageValue = stageParam as Stage;
        const results = await db.select().from(doctorProspects).where(
          eq(doctorProspects.stage, stageValue)
        ).orderBy(desc(doctorProspects.createdAt));
        return res.json({ success: true, prospects: results });
      }
      const results = await db.select().from(doctorProspects).orderBy(desc(doctorProspects.createdAt));
      res.json({ success: true, prospects: results });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/recruitment/prospects", requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const {
        fullName, email, phone, practiceName, practiceType,
        specialties, city, state, zipCode, notes, followUpAt, source
      } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ success: false, error: "Name and email are required" });
      }

      const shareToken = generateShareToken();

      const [prospect] = await db.insert(doctorProspects).values({
        fullName,
        email,
        phone: phone || null,
        practiceName: practiceName || null,
        practiceType: practiceType || null,
        specialties: Array.isArray(specialties) ? specialties : [],
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        notes: notes || null,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
        source: source || "manual",
        stage: "contacted",
        shareToken,
        addedBy: (req as any).user?.email || "admin",
        lastContactedAt: new Date(),
      }).returning();

      res.json({ success: true, prospect });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.patch("/api/recruitment/prospects/:id", requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stage, notes, followUpAt, phone, practiceName, practiceType, specialties, city, state } = req.body;

      if (stage !== undefined && !(VALID_STAGES as readonly string[]).includes(stage)) {
        return res.status(400).json({ success: false, error: `Invalid stage value. Must be one of: ${VALID_STAGES.join(', ')}` });
      }

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (stage !== undefined) updateData.stage = stage as Stage;
      if (notes !== undefined) updateData.notes = notes;
      if (followUpAt !== undefined) updateData.followUpAt = followUpAt ? new Date(followUpAt) : null;
      if (phone !== undefined) updateData.phone = phone;
      if (practiceName !== undefined) updateData.practiceName = practiceName;
      if (practiceType !== undefined) updateData.practiceType = practiceType;
      if (specialties !== undefined) updateData.specialties = Array.isArray(specialties) ? specialties : [];
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;

      const [updated] = await db.update(doctorProspects)
        .set(updateData)
        .where(eq(doctorProspects.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ success: false, error: "Prospect not found" });
      }

      res.json({ success: true, prospect: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/recruitment/prospects/:id", requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(doctorProspects).where(eq(doctorProspects.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/recruitment/prospects/:id/share-link", requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await db.select().from(doctorProspects).where(eq(doctorProspects.id, id)).limit(1);
      if (!existing.length) {
        return res.status(404).json({ success: false, error: "Prospect not found" });
      }

      let token = existing[0].shareToken;
      if (!token) {
        token = generateShareToken();
        await db.update(doctorProspects).set({ shareToken: token }).where(eq(doctorProspects.id, id));
      }

      res.json({ success: true, shareToken: token, shareUrl: `/doctor-pitch?token=${token}` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/recruitment/pitch-deck-view", async (req: Request, res: Response) => {
    try {
      const { token, timeSpentSeconds, updateTimeOnly } = req.body;
      if (!token) return res.status(400).json({ success: false, error: "Token required" });

      const prospect = await db.select().from(doctorProspects).where(eq(doctorProspects.shareToken, token)).limit(1);
      if (!prospect.length) {
        return res.status(404).json({ success: false, error: "Invalid token" });
      }

      const additionalSeconds = typeof timeSpentSeconds === "number" && timeSpentSeconds > 0
        ? Math.min(timeSpentSeconds, 3600)
        : 0;

      if (updateTimeOnly && additionalSeconds > 0) {
        await db.update(doctorProspects).set({
          pitchDeckTimeSpentSeconds: sql`${doctorProspects.pitchDeckTimeSpentSeconds} + ${additionalSeconds}`,
          updatedAt: new Date(),
        }).where(eq(doctorProspects.shareToken, token));
      } else {
        await db.update(doctorProspects).set({
          pitchDeckViews: sql`${doctorProspects.pitchDeckViews} + 1`,
          pitchDeckLastViewedAt: new Date(),
          pitchDeckTimeSpentSeconds: sql`${doctorProspects.pitchDeckTimeSpentSeconds} + ${additionalSeconds}`,
          updatedAt: new Date(),
        }).where(eq(doctorProspects.shareToken, token));
      }

      res.json({ success: true, prospectName: prospect[0].fullName });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/recruitment/pitch-deck-info", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).json({ success: false, error: "Token required" });

      const prospect = await db.select().from(doctorProspects).where(eq(doctorProspects.shareToken, token as string)).limit(1);
      if (!prospect.length) {
        return res.status(404).json({ success: false, error: "Invalid or expired link" });
      }

      res.json({
        success: true,
        name: prospect[0].fullName,
        practiceType: prospect[0].practiceType,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/recruitment/interest-form", async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone, practiceName, practiceType, specialties, city, state, zipCode, message, token } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ success: false, error: "Name and email are required" });
      }

      if (token) {
        const existing = await db.select().from(doctorProspects).where(eq(doctorProspects.shareToken, token)).limit(1);
        if (existing.length) {
          await db.update(doctorProspects).set({
            stage: "interested",
            phone: phone || existing[0].phone,
            practiceName: practiceName || existing[0].practiceName,
            practiceType: practiceType || existing[0].practiceType,
            specialties: Array.isArray(specialties) ? specialties : existing[0].specialties || [],
            city: city || existing[0].city,
            state: state || existing[0].state,
            zipCode: zipCode || existing[0].zipCode,
            notes: message ? `${existing[0].notes ? existing[0].notes + '\n\n' : ''}Prospect message: ${message}` : existing[0].notes,
            updatedAt: new Date(),
          }).where(eq(doctorProspects.shareToken, token));
          return res.json({ success: true, message: "Thank you for your interest! We'll be in touch soon." });
        }
      }

      const shareToken = generateShareToken();
      await db.insert(doctorProspects).values({
        fullName,
        email,
        phone: phone || null,
        practiceName: practiceName || null,
        practiceType: practiceType || null,
        specialties: Array.isArray(specialties) ? specialties : [],
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        notes: message ? `Prospect message: ${message}` : null,
        source: "interest_form",
        stage: "interested",
        shareToken,
        lastContactedAt: null,
      });

      res.json({ success: true, message: "Thank you for your interest! We'll be in touch soon." });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/recruitment/pipeline-stats", requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const all = await db.select().from(doctorProspects);
      const stats = {
        total: all.length,
        contacted: all.filter(p => p.stage === "contacted").length,
        interested: all.filter(p => p.stage === "interested").length,
        reviewing: all.filter(p => p.stage === "reviewing").length,
        onboarded: all.filter(p => p.stage === "onboarded").length,
        declined: all.filter(p => p.stage === "declined").length,
        totalPitchViews: all.reduce((sum, p) => sum + (p.pitchDeckViews || 0), 0),
        followUpDue: all.filter(p => p.followUpAt && new Date(p.followUpAt) <= new Date() && p.stage !== "onboarded" && p.stage !== "declined").length,
      };
      res.json({ success: true, stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
