import { Express, Request, Response } from 'express';
import { requireAuth } from '../working-auth';
import { notificationService } from '../services/notification-service';

export function registerNotificationsRoutes(app: Express): void {
  app.get('/api/notifications/stream', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected', userId: user.id })}\n\n`);

    notificationService.subscribe(user.id, res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      notificationService.unsubscribe(user.id, res);
    });
  });

  app.get('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

      const parsedLimit = parseInt(req.query.limit as string, 10);
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 50 : Math.min(parsedLimit, 100);
      const notifications = await notificationService.getForUser(user.id, limit);
      const unreadCount = await notificationService.getUnreadCount(user.id);

      res.json({ notifications, unreadCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

      await notificationService.markRead(req.params.id, user.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

      await notificationService.markAllRead(user.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/notifications/preferences', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

      const prefs = await notificationService.getPreferences(user.id);
      const defaults = {
        protocolUpdate: true,
        newMessage: true,
        trainingMilestone: true,
        memberEnrolled: true,
        protocolApprovalRequest: true,
        agentTaskCompleted: true,
        researchUpdate: true,
        systemAlert: true,
      };
      res.json({ preferences: prefs ? prefs : { userId: user.id, ...defaults } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/notifications/preferences', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

      const allowed = ['protocolUpdate', 'newMessage', 'trainingMilestone', 'memberEnrolled',
        'protocolApprovalRequest', 'agentTaskCompleted', 'researchUpdate', 'systemAlert'];
      const updates: Record<string, boolean> = {};
      for (const key of allowed) {
        if (typeof req.body[key] === 'boolean') {
          updates[key] = req.body[key];
        }
      }

      const prefs = await notificationService.upsertPreferences(user.id, updates);
      res.json({ preferences: prefs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log('[NOTIFICATIONS] SSE and notification routes registered');
}
