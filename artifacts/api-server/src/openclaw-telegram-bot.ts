import TelegramBot from 'node-telegram-bot-api';

const POLL_INTERVAL_MS = parseInt(process.env.TELEGRAM_POLL_INTERVAL || '30000', 10);
const API_PORT = process.env.PORT || '5000';
const API_BASE = `http://localhost:${API_PORT}`;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const ENABLE_INCOMING = process.env.TELEGRAM_ENABLE_INCOMING !== 'false';

if (!BOT_TOKEN) {
  console.error('[Telegram Bot] TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

if (!CHAT_ID) {
  console.error('[Telegram Bot] TELEGRAM_CHAT_ID is required');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: ENABLE_INCOMING });

let isShuttingDown = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

async function pollOutbox(): Promise<void> {
  if (isShuttingDown) return;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (OPENCLAW_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENCLAW_API_KEY}`;
    }

    const res = await fetch(`${API_BASE}/api/openclaw/outbox?status=pending`, { headers });

    if (!res.ok) {
      console.error(`[Telegram Bot] Outbox fetch failed: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json() as { messages: Array<{ id: string; fromAgent: string; message: string; priority: string }> };

    if (!data.messages || data.messages.length === 0) return;

    console.log(`[Telegram Bot] Found ${data.messages.length} pending message(s)`);

    for (const msg of data.messages) {
      if (isShuttingDown) break;

      const priorityEmoji = msg.priority === 'urgent' ? '🚨' : msg.priority === 'high' ? '⚠️' : msg.priority === 'low' ? 'ℹ️' : '📩';
      const text = `${priorityEmoji} [${msg.fromAgent}] ${msg.message}`;

      try {
        await bot.sendMessage(CHAT_ID!, text);

        const patchRes = await fetch(`${API_BASE}/api/openclaw/outbox/${msg.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'sent' }),
        });

        if (patchRes.ok) {
          console.log(`[Telegram Bot] Sent & marked message ${msg.id} from ${msg.fromAgent}`);

          await fetch(`${API_BASE}/api/openclaw/outbox/${msg.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'delivered' }),
          });
        } else {
          console.error(`[Telegram Bot] Failed to mark message ${msg.id} as sent: ${patchRes.status}`);
        }
      } catch (sendErr) {
        console.error(`[Telegram Bot] Failed to send message ${msg.id}:`, sendErr);

        await fetch(`${API_BASE}/api/openclaw/outbox/${msg.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'failed' }),
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[Telegram Bot] Poll error:', err);
  }
}

function schedulePoll(): void {
  if (isShuttingDown) return;
  pollTimer = setTimeout(async () => {
    await pollOutbox();
    schedulePoll();
  }, POLL_INTERVAL_MS);
}

if (ENABLE_INCOMING) {
  bot.on('message', async (msg) => {
    if (String(msg.chat.id) !== String(CHAT_ID)) {
      console.log(`[Telegram Bot] Ignoring message from unauthorized chat ${msg.chat.id}`);
      return;
    }

    if (!msg.text) return;

    const text = msg.text.trim();
    console.log(`[Telegram Bot] Received from Trustee: ${text.substring(0, 80)}...`);

    const agentMatch = text.match(/^@([A-Z_]+)\s*/i);
    const targetAgent = agentMatch ? agentMatch[1].toUpperCase() : 'SENTINEL';
    const messageBody = agentMatch ? text.replace(/^@[A-Z_]+\s*/i, '').trim() : text;

    try {
      const res = await fetch(`${API_BASE}/api/webhooks/openclaw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'trustee',
          to_agent: targetAgent,
          message: messageBody,
        }),
      });

      if (res.ok) {
        console.log(`[Telegram Bot] Forwarded to ${targetAgent} via webhook`);
        await bot.sendMessage(CHAT_ID!, `Forwarded to ${targetAgent}`);
      } else {
        const errBody = await res.text();
        console.error(`[Telegram Bot] Webhook failed: ${res.status} ${errBody}`);
        await bot.sendMessage(CHAT_ID!, `Failed to forward to ${targetAgent}: ${res.status}`);
      }
    } catch (err) {
      console.error('[Telegram Bot] Webhook error:', err);
      await bot.sendMessage(CHAT_ID!, `Error forwarding message: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[Telegram Bot] Polling error:', err);
  });
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Telegram Bot] ${signal} received, shutting down...`);

  if (pollTimer) clearTimeout(pollTimer);
  if (ENABLE_INCOMING) await bot.stopPolling();
  console.log('[Telegram Bot] Stopped.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log(`[Telegram Bot] Starting...`);
console.log(`[Telegram Bot] Polling outbox every ${POLL_INTERVAL_MS / 1000}s`);
console.log(`[Telegram Bot] Incoming message handling: ${ENABLE_INCOMING ? 'enabled' : 'disabled (OpenClaw gateway handles incoming)'}`);
console.log(`[Telegram Bot] API base: ${API_BASE}`);
console.log(`[Telegram Bot] Chat ID: ${CHAT_ID}`);

pollOutbox().then(() => schedulePoll());
