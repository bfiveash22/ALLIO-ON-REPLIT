import { db } from '../db';
import { openclawMessages } from '@shared/schema';

type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

/**
 * Sends a WhatsApp message from an AI Agent to the Trustee via OpenClaw
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
