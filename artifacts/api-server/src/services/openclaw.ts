import { db } from '../db';
import { openclawMessages, openclawTasks } from '@shared/schema';

type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

/**
 * Sends a Telegram message from an AI Agent to the Trustee via OpenClaw
 * @param fromAgent The name of the agent sending the message (e.g., 'SENTINEL')
 * @param message The content of the message
 * @param priority The urgency level
 */
export async function sendToTrustee(
  fromAgent: string,
  message: string,
  priority: PriorityLevel = 'normal'
) {
  try {
    await db.insert(openclawMessages).values({
      fromAgent: fromAgent.toUpperCase(),
      message: message,
      priority: priority,
      status: 'pending'
    });
    console.log(`[OpenClaw] Message queued for Trustee from ${fromAgent}: ${message.substring(0, 50)}...`);
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
    return { success: true, taskId: task.id };
  } catch (error) {
    console.error(`[OpenClaw] Failed to queue task from ${options.agentId}:`, error);
    return { success: false };
  }
}
