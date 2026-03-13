import { Express, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { openclawMessages } from '@shared/schema';
import { eq, desc, sql, and, count } from 'drizzle-orm';

function requireOpenClawAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.OPENCLAW_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'OpenClaw API key not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== apiKey) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

export function registerOpenClawRoutes(app: Express): void {
  app.get('/api/openclaw/outbox', requireOpenClawAuth, async (req: Request, res: Response) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const priorityFilter = req.query.priority as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

      const conditions: any[] = [];
      conditions.push(eq(openclawMessages.status, statusFilter || 'pending'));
      if (priorityFilter) {
        conditions.push(eq(openclawMessages.priority, priorityFilter));
      }

      const query = db.select().from(openclawMessages).where(and(...conditions));

      const priorityOrder = sql`CASE ${openclawMessages.priority}
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END`;

      const messages = await query
        .orderBy(priorityOrder, desc(openclawMessages.createdAt))
        .limit(limit);

      res.json({ messages, count: messages.length });
    } catch (error: any) {
      console.error('[OpenClaw Outbox] GET error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch outbox messages' });
    }
  });

  app.patch('/api/openclaw/outbox/:id', requireOpenClawAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Message ID is required' });
        return;
      }

      const validStatuses = ['sent', 'delivered', 'failed'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      const updateData: Record<string, any> = { status };
      if (status === 'sent') {
        updateData.sentAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      const [updated] = await db.update(openclawMessages)
        .set(updateData)
        .where(eq(openclawMessages.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.json({ message: updated });
    } catch (error: any) {
      console.error('[OpenClaw Outbox] PATCH error:', error);
      res.status(500).json({ error: error.message || 'Failed to update message' });
    }
  });

  app.get('/api/openclaw/status', requireOpenClawAuth, async (_req: Request, res: Response) => {
    try {
      const [pending] = await db.select({ count: count() }).from(openclawMessages).where(eq(openclawMessages.status, 'pending'));
      const [sent] = await db.select({ count: count() }).from(openclawMessages).where(eq(openclawMessages.status, 'sent'));
      const [delivered] = await db.select({ count: count() }).from(openclawMessages).where(eq(openclawMessages.status, 'delivered'));
      const [failed] = await db.select({ count: count() }).from(openclawMessages).where(eq(openclawMessages.status, 'failed'));

      const [lastSent] = await db.select({ sentAt: openclawMessages.sentAt })
        .from(openclawMessages)
        .where(eq(openclawMessages.status, 'sent'))
        .orderBy(desc(openclawMessages.sentAt))
        .limit(1);

      const [lastDelivered] = await db.select({ deliveredAt: openclawMessages.deliveredAt })
        .from(openclawMessages)
        .where(eq(openclawMessages.status, 'delivered'))
        .orderBy(desc(openclawMessages.deliveredAt))
        .limit(1);

      const [lastCreated] = await db.select({ createdAt: openclawMessages.createdAt })
        .from(openclawMessages)
        .orderBy(desc(openclawMessages.createdAt))
        .limit(1);

      res.json({
        counts: {
          pending: pending?.count ?? 0,
          sent: sent?.count ?? 0,
          delivered: delivered?.count ?? 0,
          failed: failed?.count ?? 0,
        },
        lastActivity: {
          lastMessageQueued: lastCreated?.createdAt ?? null,
          lastMessageSent: lastSent?.sentAt ?? null,
          lastMessageDelivered: lastDelivered?.deliveredAt ?? null,
        },
      });
    } catch (error: any) {
      console.error('[OpenClaw Status] error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch status' });
    }
  });
}
