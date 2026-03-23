import { Express, Request, Response } from 'express';
import { db } from './db';
import { trainingQuizzes, userQuizResults, userProgressTracking } from '@shared/schema';
import { requireAuth } from './working-auth';
import { eq, and } from 'drizzle-orm';

export function registerLearningRoutes(app: Express): void {
  // Get quizzes for a module
  app.get('/api/learning/modules/:moduleId/quizzes', requireAuth, async (req: Request, res: Response) => {
    try {
      const quizzes = await db.select().from(trainingQuizzes)
        .where(eq(trainingQuizzes.moduleId, req.params.moduleId));
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit quiz results
  app.post('/api/learning/quizzes/:quizId/submit', requireAuth, async (req: Request, res: Response) => {
    try {
      const { score, passed, answers } = req.body;
      const userId = (req.user as any).id;
      
      const [result] = await db.insert(userQuizResults).values({
        userId,
        quizId: req.params.quizId,
        score,
        passed,
        answers
      }).returning();
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/learning/progress', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const progress = await db.select().from(userProgressTracking)
        .where(eq(userProgressTracking.userId, userId));
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user progress for a module
  app.get('/api/learning/progress/:moduleId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const [progress] = await db.select().from(userProgressTracking)
        .where(and(
          eq(userProgressTracking.userId, userId),
          eq(userProgressTracking.moduleId, req.params.moduleId)
        )).limit(1);
        
      res.json(progress || { progressPercentage: 0, status: 'unstarted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user progress
  app.post('/api/learning/progress/:moduleId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { progressPercentage, status } = req.body;
      
      // Check if exists
      const [existing] = await db.select().from(userProgressTracking)
        .where(and(
          eq(userProgressTracking.userId, userId),
          eq(userProgressTracking.moduleId, req.params.moduleId)
        )).limit(1);
        
      let result;
      if (existing) {
        [result] = await db.update(userProgressTracking)
          .set({ 
            progressPercentage, 
            status,
            lastAccessedAt: new Date(),
            completedAt: status === 'completed' && existing.status !== 'completed' ? new Date() : existing.completedAt
          })
          .where(eq(userProgressTracking.id, existing.id))
          .returning();
      } else {
        [result] = await db.insert(userProgressTracking)
          .values({
            userId,
            moduleId: req.params.moduleId,
            progressPercentage,
            status,
            completedAt: status === 'completed' ? new Date() : null
          })
          .returning();
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
