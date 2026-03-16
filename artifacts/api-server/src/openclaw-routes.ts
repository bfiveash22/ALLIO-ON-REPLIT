import { Express, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { openclawMessages, openclawTasks } from '@shared/schema';
import { eq, desc, sql, and, count, gte, lte } from 'drizzle-orm';
import { requireAuth, requireRole } from './working-auth';

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

  app.get('/api/openclaw/status', requireOpenClawAuth, async (req: Request, res: Response) => {
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

      const host = req.headers.host || process.env.REPLIT_DEV_DOMAIN || 'localhost';
      const protocol = host.includes('replit') ? 'https' : req.protocol;
      const baseUrl = `${protocol}://${host}`;

      res.json({
        gateway: 'OPENCLAW',
        version: '1.0',
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
        endpoints: {
          webhook: `${baseUrl}/api/openclaw/webhook`,
          send: `${baseUrl}/api/openclaw/send`,
          outbox: `${baseUrl}/api/openclaw/outbox`,
          tasks: `${baseUrl}/api/openclaw/tasks`,
          response: `${baseUrl}/api/openclaw/response`,
        },
        webhookAvailable: true,
        authentication: 'Bearer token via OPENCLAW_API_KEY',
      });
    } catch (error: any) {
      console.error('[OpenClaw Status] error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch status' });
    }
  });

  app.post('/api/openclaw/webhook', requireOpenClawAuth, async (req: Request, res: Response) => {
    try {
      const { sourceAgent, targetAgent, messageType, content, priority, correlationId, metadata } = req.body;

      if (!sourceAgent || typeof sourceAgent !== 'string') {
        res.status(400).json({ error: 'sourceAgent is required and must be a string' });
        return;
      }
      if (!content || typeof content !== 'string') {
        res.status(400).json({ error: 'content is required and must be a string (message body)' });
        return;
      }

      const validPriorities = ['urgent', 'high', 'normal', 'low'];
      if (priority && !validPriorities.includes(priority)) {
        res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
        return;
      }

      const [message] = await db.insert(openclawMessages).values({
        fromAgent: sourceAgent.toUpperCase(),
        toRecipient: targetAgent?.toUpperCase() || 'SENTINEL',
        message: content.substring(0, 50000),
        priority: priority || 'normal',
        status: 'delivered',
        deliveredAt: new Date(),
      }).returning();

      console.log(`[OpenClaw Webhook] Inbound message ${message.id} from ${sourceAgent} to ${targetAgent || 'SENTINEL'} (${messageType || 'general'})`);

      if (messageType === 'task_request' || messageType === 'task') {
        const [task] = await db.insert(openclawTasks).values({
          agentId: (targetAgent || sourceAgent).toUpperCase(),
          taskType: messageType || 'general',
          description: content.substring(0, 10000),
          priority: priority || 'normal',
          status: 'pending',
          context: metadata || null,
          callbackUrl: null,
        }).returning();

        console.log(`[OpenClaw Webhook] Auto-created task ${task.id} from inbound message`);

        res.status(201).json({
          received: true,
          messageId: message.id,
          taskId: task.id,
          correlationId: correlationId || null,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(201).json({
        received: true,
        messageId: message.id,
        correlationId: correlationId || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[OpenClaw Webhook] POST error:', error);
      res.status(500).json({ error: error.message || 'Failed to process webhook' });
    }
  });

  app.post('/api/openclaw/send', requireOpenClawAuth, async (req: Request, res: Response) => {
    try {
      const { agent_id, task_type, description, priority, context, callback_url } = req.body;

      if (!agent_id || typeof agent_id !== 'string') {
        res.status(400).json({ error: 'agent_id is required and must be a string' });
        return;
      }
      if (!description || typeof description !== 'string') {
        res.status(400).json({ error: 'description is required and must be a string' });
        return;
      }

      const validPriorities = ['urgent', 'high', 'normal', 'low'];
      if (priority && !validPriorities.includes(priority)) {
        res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
        return;
      }
      if (context !== undefined && (typeof context !== 'object' || context === null || Array.isArray(context))) {
        res.status(400).json({ error: 'context must be a JSON object if provided' });
        return;
      }
      if (callback_url && typeof callback_url !== 'string') {
        res.status(400).json({ error: 'callback_url must be a string if provided' });
        return;
      }

      const [task] = await db.insert(openclawTasks).values({
        agentId: agent_id.toUpperCase(),
        taskType: task_type || 'general',
        description: description.substring(0, 10000),
        priority: priority || 'normal',
        status: 'pending',
        context: context || null,
        callbackUrl: callback_url || null,
      }).returning();

      console.log(`[OpenClaw] Task created: ${task.id} from ${agent_id} (${task_type})`);

      res.status(201).json({
        message_id: task.id,
        status: 'pending',
        estimated_response: priority === 'urgent' ? '< 1 hour' : priority === 'high' ? '< 4 hours' : '< 24 hours',
      });
    } catch (error: any) {
      console.error('[OpenClaw Send] POST error:', error);
      res.status(500).json({ error: error.message || 'Failed to create task' });
    }
  });

  app.post('/api/openclaw/response', requireOpenClawAuth, async (req: Request, res: Response) => {
    try {
      const { message_id, status, result, error_message } = req.body;

      if (!message_id || typeof message_id !== 'string') {
        res.status(400).json({ error: 'message_id is required and must be a string' });
        return;
      }

      const validStatuses = ['in_progress', 'completed', 'failed'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      if (result !== undefined && typeof result !== 'object') {
        res.status(400).json({ error: 'result must be a JSON object if provided' });
        return;
      }

      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'in_progress') {
        updateData.startedAt = new Date();
      } else if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }

      if (result !== undefined) {
        updateData.result = result;
      }

      if (error_message && typeof error_message === 'string') {
        updateData.errorMessage = error_message.substring(0, 5000);
      }

      const [updated] = await db.update(openclawTasks)
        .set(updateData)
        .where(eq(openclawTasks.id, message_id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      console.log(`[OpenClaw] Task ${message_id} updated to ${status}`);

      res.json({ task: updated });
    } catch (error: any) {
      console.error('[OpenClaw Response] POST error:', error);
      res.status(500).json({ error: error.message || 'Failed to update task' });
    }
  });

  app.get('/api/openclaw/tasks', requireAuth, requireRole('admin', 'trustee'), async (req: Request, res: Response) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const priorityFilter = req.query.priority as string | undefined;
      const agentFilter = req.query.agent as string | undefined;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(openclawTasks.status, statusFilter));
      }
      if (priorityFilter && priorityFilter !== 'all') {
        conditions.push(eq(openclawTasks.priority, priorityFilter));
      }
      if (agentFilter && agentFilter !== 'all') {
        conditions.push(eq(openclawTasks.agentId, agentFilter.toUpperCase()));
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) {
          conditions.push(gte(openclawTasks.createdAt, from));
        }
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          conditions.push(lte(openclawTasks.createdAt, to));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const priorityOrder = sql`CASE ${openclawTasks.priority}
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END`;

      const [tasks, [totalResult], [pendingCount], [inProgressCount], [completedCount], [failedCount]] = await Promise.all([
        db.select().from(openclawTasks)
          .where(whereClause)
          .orderBy(priorityOrder, desc(openclawTasks.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(openclawTasks).where(whereClause),
        db.select({ count: count() }).from(openclawTasks).where(eq(openclawTasks.status, 'pending')),
        db.select({ count: count() }).from(openclawTasks).where(eq(openclawTasks.status, 'in_progress')),
        db.select({ count: count() }).from(openclawTasks).where(eq(openclawTasks.status, 'completed')),
        db.select({ count: count() }).from(openclawTasks).where(eq(openclawTasks.status, 'failed')),
      ]);

      res.json({
        tasks,
        pagination: {
          page,
          limit,
          total: totalResult?.count ?? 0,
          totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
        },
        summary: {
          pending: pendingCount?.count ?? 0,
          in_progress: inProgressCount?.count ?? 0,
          completed: completedCount?.count ?? 0,
          failed: failedCount?.count ?? 0,
        },
      });
    } catch (error: any) {
      console.error('[OpenClaw Tasks] GET error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
    }
  });
}
