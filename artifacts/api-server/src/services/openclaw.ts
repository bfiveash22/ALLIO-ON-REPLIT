import { db } from '../db';
import { openclawMessages, openclawTasks } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

const WEBHOOK_URL = process.env.OPENCLAW_WEBHOOK_URL || '';
const MAX_RETRIES = 3;
const FLUSH_BATCH_SIZE = 100;
const MAX_FLUSH_ITERATIONS = 50;

async function forwardToWebhook(
  fromAgent: string,
  message: string,
  priority: PriorityLevel
): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn('[OpenClaw] OPENCLAW_WEBHOOK_URL not configured — skipping webhook forward');
    return false;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAgent, message, priority }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (resp.ok) {
        console.log(`[OpenClaw] Webhook delivered (attempt ${attempt}): ${fromAgent}`);
        return true;
      }

      console.warn(`[OpenClaw] Webhook returned ${resp.status} (attempt ${attempt}/${MAX_RETRIES})`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[OpenClaw] Webhook attempt ${attempt}/${MAX_RETRIES} failed: ${errMsg}`);
    }

    if (attempt < MAX_RETRIES) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  console.error(`[OpenClaw] Webhook delivery failed after ${MAX_RETRIES} attempts for ${fromAgent}`);
  return false;
}

export async function sendToTrustee(
  fromAgent: string,
  message: string,
  priority: PriorityLevel = 'normal'
) {
  try {
    const [row] = await db.insert(openclawMessages).values({
      fromAgent: fromAgent.toUpperCase(),
      message: message,
      priority: priority,
      status: 'pending'
    }).returning();

    console.log(`[OpenClaw] Message queued for Trustee from ${fromAgent}: ${message.substring(0, 50)}...`);

    const delivered = await forwardToWebhook(fromAgent.toUpperCase(), message, priority);
    if (delivered && row) {
      await db.update(openclawMessages)
        .set({ status: 'delivered', deliveredAt: new Date() })
        .where(eq(openclawMessages.id, row.id));
    }

    return true;
  } catch (error) {
    console.error(`[OpenClaw] Failed to queue message from ${fromAgent}:`, error);
    return false;
  }
}

interface SendToOpenClawOptions {
  agentId: string;
  taskType?: string;
  description: string;
  priority?: PriorityLevel;
  context?: Record<string, unknown>;
  callbackUrl?: string;
}

export async function sendToOpenClaw(options: SendToOpenClawOptions): Promise<{ success: boolean; taskId?: string }> {
  try {
    const [task] = await db.insert(openclawTasks).values({
      agentId: options.agentId.toUpperCase(),
      taskType: options.taskType || 'general',
      description: options.description,
      priority: options.priority || 'normal',
      status: 'pending',
      context: options.context || null,
      callbackUrl: options.callbackUrl || null,
    }).returning();

    console.log(`[OpenClaw] Task queued: ${task.id} from ${options.agentId} (${options.taskType})`);

    const delivered = await forwardToWebhook(
      options.agentId.toUpperCase(),
      `[Task ${options.taskType || 'general'}] ${options.description}`,
      (options.priority as PriorityLevel) || 'normal'
    );

    if (!delivered) {
      console.warn(`[OpenClaw] Task ${task.id} webhook delivery failed — will be picked up by flush`);
    }

    return { success: true, taskId: task.id };
  } catch (error) {
    console.error(`[OpenClaw] Failed to queue task from ${options.agentId}:`, error);
    return { success: false };
  }
}

export async function forwardTaskToWebhook(
  agentId: string,
  taskType: string,
  description: string,
  priority: PriorityLevel = 'normal'
): Promise<boolean> {
  return forwardToWebhook(
    agentId.toUpperCase(),
    `[Task ${taskType}] ${description}`,
    priority
  );
}

export async function flushPendingMessages(): Promise<{ processed: number; delivered: number; failed: number }> {
  if (!WEBHOOK_URL) {
    console.warn('[OpenClaw] OPENCLAW_WEBHOOK_URL not configured — cannot flush');
    return { processed: 0, delivered: 0, failed: 0 };
  }

  let totalProcessed = 0;
  let totalDelivered = 0;
  let totalFailed = 0;
  let iteration = 0;

  console.log('[OpenClaw] Starting flush of pending messages...');

  while (iteration < MAX_FLUSH_ITERATIONS) {
    iteration++;

    const batch = await db.select({ id: openclawMessages.id, fromAgent: openclawMessages.fromAgent, message: openclawMessages.message, priority: openclawMessages.priority })
      .from(openclawMessages)
      .where(
        and(
          eq(openclawMessages.status, 'pending'),
          eq(openclawMessages.direction, 'outbound')
        )
      )
      .limit(FLUSH_BATCH_SIZE);

    if (batch.length === 0) break;

    const batchIds = batch.map(m => m.id);
    await db.update(openclawMessages)
      .set({ status: 'sending' as string })
      .where(inArray(openclawMessages.id, batchIds));

    for (const msg of batch) {
      totalProcessed++;
      const delivered = await forwardToWebhook(
        msg.fromAgent,
        msg.message,
        (msg.priority as PriorityLevel) || 'normal'
      );

      if (delivered) {
        await db.update(openclawMessages)
          .set({ status: 'delivered', deliveredAt: new Date() })
          .where(eq(openclawMessages.id, msg.id));
        totalDelivered++;
      } else {
        await db.update(openclawMessages)
          .set({ status: 'failed' })
          .where(eq(openclawMessages.id, msg.id));
        totalFailed++;
      }
    }

    if (batch.length < FLUSH_BATCH_SIZE) break;

    await new Promise(r => setTimeout(r, 500));
  }

  if (iteration >= MAX_FLUSH_ITERATIONS) {
    console.warn(`[OpenClaw] Flush hit iteration limit (${MAX_FLUSH_ITERATIONS}). Some messages may remain pending.`);
  }

  console.log(`[OpenClaw] Flush complete: ${totalProcessed} processed, ${totalDelivered} delivered, ${totalFailed} failed`);
  return { processed: totalProcessed, delivered: totalDelivered, failed: totalFailed };
}
