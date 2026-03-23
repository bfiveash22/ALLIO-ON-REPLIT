import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { trainingModuleSections, trainingModuleKeyPoints, trainingCertifications, quizAttempts, quizzes, trackModules, moduleQuizzes } from "@shared/schema";
import { insertUserProgressSchema } from "@shared/schema";
import { and } from "drizzle-orm";
import { notificationService } from "../services/notification-service";
import OpenAI from "openai";
import { cacheMiddleware, CACHE_TTL } from "../lib/cache";

export function registerTrainingRoutes(app: Express): void {
  app.get("/api/training/modules", cacheMiddleware(CACHE_TTL.MEDIUM, "training"), async (req: Request, res: Response) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/modules/:slug", async (req: Request, res: Response) => {
    try {
      const module = await storage.getTrainingModuleBySlug(req.params.slug);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/modules/:moduleId/content", requireAuth, async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;

      const sections = await db.select()
        .from(trainingModuleSections)
        .where(eq(trainingModuleSections.moduleId, moduleId))
        .orderBy(trainingModuleSections.sortOrder);

      const keyPoints = await db.select()
        .from(trainingModuleKeyPoints)
        .where(eq(trainingModuleKeyPoints.moduleId, moduleId))
        .orderBy(trainingModuleKeyPoints.sortOrder);

      res.json({
        sections: sections.map(s => ({ title: s.title, content: s.content })),
        keyPoints: keyPoints.map(k => k.point),
      });
    } catch (error: any) {
      console.error("[Training] Error fetching module content:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/tracks", cacheMiddleware(CACHE_TTL.MEDIUM, "training"), async (req: Request, res: Response) => {
    try {
      const tracks = await storage.getTrainingTracks();
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/tracks/:slug", async (req: Request, res: Response) => {
    try {
      const track = await storage.getTrainingTrackBySlug(req.params.slug);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my/certifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const certs = await db.select()
        .from(trainingCertifications)
        .where(eq(trainingCertifications.userId, userId))
        .orderBy(trainingCertifications.createdAt);
      res.json({ success: true, certifications: certs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/certifications/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const requestingUserId = (req as any).user?.claims?.sub || (req as any).user?.id;
      const userRole = (req as any).user?.role;
      if (userId !== requestingUserId && userRole !== "admin" && userRole !== "trustee") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      const certs = await db.select()
        .from(trainingCertifications)
        .where(eq(trainingCertifications.userId, userId))
        .orderBy(trainingCertifications.createdAt);
      res.json({ success: true, certifications: certs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/certifications/issue", requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const { userId, certificationType, referenceId, referenceTitle, score, passingScore } = req.body;

      if (!userId || !certificationType || !referenceId || !referenceTitle) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const status = score >= (passingScore || 80) ? "passed" : "failed";
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const certNumber = `ALLIO-${certificationType.toUpperCase().slice(0, 3)}-${timestamp}`;
      const verificationCode = `V${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const [certification] = await db.insert(trainingCertifications).values({
        userId,
        certificationType,
        referenceId,
        referenceTitle,
        status,
        score,
        passingScore: passingScore || 80,
        attemptsUsed: 1,
        certificateNumber: status === "passed" ? certNumber : null,
        verificationCode: status === "passed" ? verificationCode : null,
        issuedAt: status === "passed" ? new Date() : null,
      }).returning();

      res.json({
        success: true,
        certification,
        passed: status === "passed",
        message: status === "passed"
          ? `Congratulations! You've earned your ${referenceTitle} certification.`
          : `Score: ${score}%. Passing score is ${passingScore || 80}%. Please try again.`
      });
    } catch (error: any) {
      console.error("[Certification] Error issuing certification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/certifications/verify/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const [cert] = await db.select()
        .from(trainingCertifications)
        .where(eq(trainingCertifications.verificationCode, code))
        .limit(1);

      if (!cert) {
        return res.status(404).json({ success: false, error: "Certificate not found" });
      }

      res.json({
        success: true,
        valid: cert.status === "passed",
        certification: {
          certificateNumber: cert.certificateNumber,
          referenceTitle: cert.referenceTitle,
          issuedAt: cert.issuedAt,
          status: cert.status,
          score: cert.score
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/certifications/lba/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { attemptId } = req.body;
      const LBA_CERT_EXAM_ID = "quiz-lba-certification";
      const LBA_PASSING_SCORE = 80;

      if (!attemptId || typeof attemptId !== "string") {
        return res.status(400).json({ success: false, error: "Missing attemptId — complete the certification exam first" });
      }

      const [attempt] = await db.select()
        .from(quizAttempts)
        .where(and(
          eq(quizAttempts.id, attemptId),
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, LBA_CERT_EXAM_ID),
        ))
        .limit(1);

      if (!attempt) {
        return res.status(404).json({ success: false, error: "Exam attempt not found or does not belong to you" });
      }

      if (!attempt.completedAt) {
        return res.status(400).json({ success: false, error: "Exam attempt is not yet completed" });
      }

      const score = attempt.percentage ?? 0;

      const existingCerts = await db.select()
        .from(trainingCertifications)
        .where(and(
          eq(trainingCertifications.userId, userId),
          eq(trainingCertifications.referenceId, LBA_CERT_EXAM_ID),
          eq(trainingCertifications.status, "passed"),
        ))
        .limit(1);

      if (existingCerts.length > 0) {
        return res.json({
          success: true,
          alreadyCertified: true,
          certification: existingCerts[0],
          message: "You are already certified as an FFPMA LBA Practitioner.",
        });
      }

      const LBA_TRACK_ID = "track-lba-practitioner";
      const requiredModules = await db.select()
        .from(trackModules)
        .where(and(
          eq(trackModules.trackId, LBA_TRACK_ID),
          eq(trackModules.isRequired, true),
        ));

      const incompleteModules: string[] = [];
      for (const tm of requiredModules) {
        const requiredQuizzes = await db.select()
          .from(moduleQuizzes)
          .where(and(
            eq(moduleQuizzes.moduleId, tm.moduleId),
            eq(moduleQuizzes.isRequired, true),
          ));

        for (const mq of requiredQuizzes) {
          const allAttempts = await db.select()
            .from(quizAttempts)
            .where(and(
              eq(quizAttempts.userId, userId),
              eq(quizAttempts.quizId, mq.quizId),
            ));

          const hasPassed = allAttempts.some(a => a.completedAt && (a.percentage ?? 0) >= 80);
          if (!hasPassed) {
            incompleteModules.push(tm.moduleId);
            break;
          }
        }
      }

      if (incompleteModules.length > 0) {
        return res.status(400).json({
          success: false,
          error: `You must complete all ${requiredModules.length} LBA modules with passing quiz scores before taking the certification exam.`,
          incompleteModules,
        });
      }

      const existingForAttempt = await db.select()
        .from(trainingCertifications)
        .where(and(
          eq(trainingCertifications.userId, userId),
          eq(trainingCertifications.referenceId, LBA_CERT_EXAM_ID),
        ));

      const alreadyProcessed = existingForAttempt.some(
        (c: any) => c.metadata && (c.metadata as any).attemptId === attemptId
      );
      if (alreadyProcessed) {
        const existing = existingForAttempt.find(
          (c: any) => c.metadata && (c.metadata as any).attemptId === attemptId
        );
        return res.json({
          success: true,
          passed: existing?.status === "passed",
          certification: existing,
          message: "This exam attempt has already been processed.",
        });
      }

      const priorAttempts = await db.select()
        .from(quizAttempts)
        .where(and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, LBA_CERT_EXAM_ID),
        ));

      if (priorAttempts.length > 3) {
        return res.status(400).json({
          success: false,
          error: "Maximum attempts (3) reached for the LBA Certification Exam.",
        });
      }

      const passed = score >= LBA_PASSING_SCORE;
      const certNumber = passed
        ? `FFPMA-LBA-${String(Date.now()).slice(-8)}-${String(priorAttempts.length).padStart(4, "0")}`
        : null;
      const verificationCode = passed
        ? `LBA${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        : null;

      const [certification] = await db.insert(trainingCertifications).values({
        userId,
        certificationType: "specialist",
        referenceId: LBA_CERT_EXAM_ID,
        referenceTitle: "FFPMA Live Blood Analysis Practitioner",
        status: passed ? "passed" : "failed",
        score,
        passingScore: LBA_PASSING_SCORE,
        attemptsUsed: priorAttempts.length,
        maxAttempts: 3,
        certificateNumber: certNumber,
        verificationCode,
        issuedAt: passed ? new Date() : null,
        expiresAt: passed ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        metadata: { trackId: "track-lba-practitioner", examId: LBA_CERT_EXAM_ID, attemptId },
      }).returning();

      res.json({
        success: true,
        passed,
        certification,
        message: passed
          ? `Congratulations! You have earned your FFPMA LBA Practitioner Certification. Certificate #${certNumber}`
          : `Score: ${score}%. Passing score is ${LBA_PASSING_SCORE}%. You have ${3 - priorAttempts.length} attempt(s) remaining.`,
      });
    } catch (error: any) {
      console.error("[LBA Certification] Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/my/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const contentType = req.query.type as string || "module";
      const progress = await storage.getUserProgressByType(userId, contentType);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my/progress/:contentType/:contentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const progress = await storage.getUserProgress(userId, req.params.contentType, req.params.contentId);
      if (!progress) {
        return res.json({ status: "not_started", progressPercent: 0 });
      }
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/my/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const partialSchema = insertUserProgressSchema.partial().required({ contentType: true, contentId: true });
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }
      const { contentType, contentId, status, progressPercent, timeSpent, notes } = parsed.data;
      const progress = await storage.upsertUserProgress({
        userId,
        contentType,
        contentId,
        status: status || "in_progress",
        progressPercent: progressPercent || 0,
        timeSpent,
        notes,
      });
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/my/progress/:contentType/:contentId/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const progress = await storage.completeUserProgress(userId, req.params.contentType, req.params.contentId);
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/ai-tutor", requireAuth, async (req: Request, res: Response) => {
    try {
      const { question, moduleSlug, moduleTitle } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are ALLIO, the AI tutor for Forgotten Formula PMA's healing education platform. You help members understand health and wellness concepts with warmth, clarity, and wisdom.

Your teaching style:
- Warm but not saccharine
- Knowledgeable but not condescending
- Use simple analogies to explain complex concepts
- Always emphasize the body's innate healing wisdom
- Reference natural healing approaches over synthetic solutions

${moduleTitle ? `The member is studying: "${moduleTitle}"` : ''}

Keep responses helpful, educational, and under 300 words. End with encouragement or a thought-provoking follow-up question when appropriate.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const answer = completion.choices[0]?.message?.content || 'I apologize, but I was unable to formulate a response. Please try asking your question in a different way.';

      res.json({ answer, modelUsed: 'ALLIO (GPT-4o)' });
    } catch (error: any) {
      console.error('[AI Tutor] Error:', error.message);
      res.status(500).json({ error: "Failed to get AI response. Please try again." });
    }
  });

  app.get("/api/training/modules/:moduleId/quiz", requireAuth, async (req: Request, res: Response) => {
    try {
      const quiz = await storage.getQuizByModuleId(req.params.moduleId);
      if (!quiz) {
        return res.status(404).json({ error: "No quiz found for this module" });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      res.json({ quiz, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDriveDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/quizzes/:slug", async (req: Request, res: Response) => {
    try {
      const quiz = await storage.getQuizBySlug(req.params.slug);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      const quizWithCount = { ...quiz, questionsCount: questions.length };
      res.json({ quiz: quizWithCount, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quizzes/:quizId/attempts", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const quizId = req.params.quizId;

      const attempt = await storage.createQuizAttempt({
        userId,
        quizId,
      });
      res.status(201).json(attempt);
    } catch (error: any) {
      console.error("Error creating quiz attempt:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  const quizSubmitSchema = z.object({
    responses: z.array(z.object({
      questionId: z.string(),
      selectedAnswerId: z.string(),
    })),
  });

  app.post("/api/quizzes/attempts/:attemptId/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const { attemptId } = req.params;
      const userId = req.user?.id as string;

      const parseResult = quizSubmitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      const { responses } = parseResult.data;

      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }

      if (attempt.userId !== userId) {
        return res.status(403).json({ error: "You are not authorized to submit this quiz attempt" });
      }

      if (attempt.completedAt) {
        return res.status(400).json({ error: "This quiz attempt has already been submitted" });
      }

      const quiz = await storage.getQuiz(attempt.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const questions = await storage.getQuizQuestions(attempt.quizId);
      const questionMap = new Map(questions.map(q => [q.id, q]));

      for (const response of responses) {
        if (!questionMap.has(response.questionId)) {
          return res.status(400).json({ error: `Question ${response.questionId} does not belong to this quiz` });
        }
      }

      let score = 0;
      let maxScore = 0;

      for (const response of responses) {
        const question = questionMap.get(response.questionId);
        if (!question) continue;

        const correctAnswer = question.answers.find(a => a.isCorrect);
        const points = question.points;

        maxScore += points;
        const isCorrect = correctAnswer?.id === response.selectedAnswerId;
        const pointsEarned = isCorrect ? points : 0;
        score += pointsEarned;

        await storage.createQuizResponse({
          attemptId,
          questionId: response.questionId,
          selectedAnswerId: response.selectedAnswerId,
          isCorrect,
          pointsEarned,
        });
      }

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const passed = percentage >= (quiz.passingScore || 70);

      const updatedAttempt = await storage.updateQuizAttempt(attemptId, {
        score,
        maxScore,
        percentage,
        passed,
        completedAt: new Date(),
      });

      if (passed) {
        const userId = req.user?.id as string;
        if (userId) {
          notificationService.createForUser(
            userId,
            'training_milestone',
            'Quiz Passed!',
            `Congratulations! You passed "${quiz.title}" with a score of ${percentage}%.`,
            { quizId: quiz.id, score: percentage }
          ).catch(() => {});
        }
      }

      res.json({
        attempt: updatedAttempt,
        score,
        maxScore,
        percentage,
        passed,
        passingScore: quiz.passingScore,
      });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  app.get("/api/my-quiz-attempts", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const quizId = req.query.quizId as string | undefined;
      const attempts = await storage.getQuizAttempts(userId, quizId);
      res.json(attempts);
    } catch (error: any) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });
}
