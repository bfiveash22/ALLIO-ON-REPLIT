import crypto from 'crypto';
import { db } from '../db';
import { webhookEndpoints } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function isUnsafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return true;
    const hostname = parsed.hostname.toLowerCase();
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]', 'metadata.google.internal', '169.254.169.254'];
    if (blocked.includes(hostname)) return true;
    if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) return true;
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return true;
    return false;
  } catch {
    return true;
  }
}

export type WebhookEvent =
  | 'task.completed'
  | 'task.failed'
  | 'task.stuck'
  | 'sync.completed'
  | 'agent.error'
  | 'briefing.morning'
  | 'briefing.evening';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverWebhook(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<boolean> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ALLIO-Signature': signature,
        'X-ALLIO-Event': payload.event,
        'X-ALLIO-Delivery': crypto.randomUUID(),
        'User-Agent': 'ALLIO-Webhook/1.0',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    await db.update(webhookEndpoints)
      .set({ lastDeliveryAt: new Date(), lastDeliveryStatus: response.status })
      .where(eq(webhookEndpoints.id, endpointId));

    if (response.ok) {
      return true;
    }

    console.log(`[WEBHOOK] Delivery to ${url} returned ${response.status} (attempt ${attempt}/${MAX_RETRIES})`);
  } catch (err: any) {
    console.log(`[WEBHOOK] Delivery to ${url} failed: ${err.message} (attempt ${attempt}/${MAX_RETRIES})`);
  }

  if (attempt < MAX_RETRIES) {
    const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    return deliverWebhook(endpointId, url, secret, payload, attempt + 1);
  }

  return false;
}

export async function dispatchWebhook(event: WebhookEvent, data: Record<string, any>): Promise<void> {
  try {
    const endpoints = await db.select().from(webhookEndpoints)
      .where(eq(webhookEndpoints.isActive, true));

    const matchingEndpoints = endpoints.filter(ep =>
      ep.events.includes(event) || ep.events.includes('*')
    );

    if (matchingEndpoints.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const deliveries = matchingEndpoints.map(ep =>
      deliverWebhook(ep.id, ep.url, ep.secret, payload).catch(err => {
        console.error(`[WEBHOOK] Unhandled error for ${ep.url}:`, err.message);
        return false;
      })
    );

    await Promise.allSettled(deliveries);
  } catch (err: any) {
    console.error('[WEBHOOK] Dispatch error:', err.message);
  }
}

export async function testWebhook(endpointId: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const rows = await db.select().from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, endpointId));

    if (rows.length === 0) return { success: false, error: 'Endpoint not found' };

    const ep = rows[0];
    const payload: WebhookPayload = {
      event: 'task.completed',
      timestamp: new Date().toISOString(),
      data: { test: true, message: 'ALLIO webhook test delivery' },
    };

    const body = JSON.stringify(payload);
    const signature = signPayload(body, ep.secret);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(ep.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ALLIO-Signature': signature,
        'X-ALLIO-Event': 'task.completed',
        'X-ALLIO-Delivery': crypto.randomUUID(),
        'User-Agent': 'ALLIO-Webhook/1.0 (Test)',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    await db.update(webhookEndpoints)
      .set({ lastDeliveryAt: new Date(), lastDeliveryStatus: response.status })
      .where(eq(webhookEndpoints.id, endpointId));

    return { success: response.ok, statusCode: response.status };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
