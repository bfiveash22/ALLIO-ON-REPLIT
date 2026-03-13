# OPENCLAW ↔ ALLIO INTEGRATION - SAME VPS ARCHITECTURE
**Date:** 2026-03-08 19:45 UTC  
**Environment:** Both OpenClaw (Allio/me) and Allio agents on same VPS (130.49.160.73)

---

## 🏗️ SIMPLIFIED ARCHITECTURE (WE'RE ON SAME MACHINE!)

**Key Advantage:** No external webhooks needed - everything is localhost!

---

## 🔄 AGENTS → TRUSTEE (via OpenClaw)

### Method 1: Shared Database (RECOMMENDED)

**Allio agents write to database table:**
```sql
-- Create table (if doesn't exist)
CREATE TABLE openclaw_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent VARCHAR NOT NULL,
  to_recipient VARCHAR DEFAULT 'trustee',
  message TEXT NOT NULL,
  priority VARCHAR DEFAULT 'normal',
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP
);
```

**Agent workflow:**
```javascript
// SENTINEL wants to message Trustee
await db.query(`
  INSERT INTO openclaw_messages (from_agent, message, priority)
  VALUES ('SENTINEL', 'Need approval: New clinic application', 'high')
`);
```

**OpenClaw (me) polls database every 3 min:**
```javascript
// I check for pending messages
const pending = await db.query(`
  SELECT * FROM openclaw_messages 
  WHERE status = 'pending' 
  ORDER BY priority DESC, created_at ASC
`);

// Send via WhatsApp
for (const msg of pending) {
  await sendWhatsApp(msg.message);
  await markSent(msg.id);
}
```

**Location:** Same database you're already using (`DATABASE_URL` in `/root/allio-v1/.env`)

---

### Method 2: Localhost API (Alternative)

**Allio agents POST to localhost:**
```javascript
POST http://localhost:5000/api/openclaw/outbox
{
  "from_agent": "SENTINEL",
  "message": "Need approval for X",
  "priority": "high"
}
```

**OpenClaw polls localhost:**
```javascript
// I poll every 3 min
const response = await fetch('http://localhost:5000/api/openclaw/outbox?status=pending');
const messages = await response.json();

// Send and mark as sent
```

---

## 📥 TRUSTEE → AGENTS (via OpenClaw)

### Real-Time Webhook (FAST)

**Trustee sends WhatsApp message:**
```
@SENTINEL Approved - proceed with clinic onboarding
```

**OpenClaw (me) receives instantly:**
- Parse message for agent name (`@SENTINEL`)
- Extract command/message
- POST to localhost Allio endpoint

**I POST to Allio immediately:**
```javascript
POST http://localhost:5000/api/webhooks/openclaw
{
  "from": "trustee",
  "to_agent": "SENTINEL",
  "message": "Approved - proceed with clinic onboarding",
  "timestamp": "2026-03-08T19:45:00Z"
}
```

**Allio routes to agent:**
```javascript
// Allio receives, routes to SENTINEL's task queue
const agent = message.to_agent;
await notifyAgent(agent, message.message);
```

---

## 🎯 WHAT ANTIGRAVITY NEEDS TO BUILD

### 1. Database Table (5 min)

```sql
CREATE TABLE openclaw_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent VARCHAR NOT NULL,
  to_recipient VARCHAR DEFAULT 'trustee',
  message TEXT NOT NULL,
  priority VARCHAR DEFAULT 'normal',  -- urgent, high, normal, low
  status VARCHAR DEFAULT 'pending',   -- pending, sent, delivered
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE INDEX idx_openclaw_status ON openclaw_messages(status, created_at);
```

### 2. Agent Helper Function (10 min)

```javascript
// server/services/openclaw.ts
export async function sendToTrustee(
  fromAgent: string, 
  message: string, 
  priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal'
) {
  await db.insert(openclawMessages).values({
    from_agent: fromAgent,
    message: message,
    priority: priority,
    status: 'pending'
  });
}

// Usage by agents:
import { sendToTrustee } from './services/openclaw';

// SENTINEL wants approval
await sendToTrustee('SENTINEL', 'Need approval: New clinic application from Dr. Smith', 'high');
```

### 3. Webhook Handler (15 min)

```javascript
// server/routes.ts
app.post('/api/webhooks/openclaw', async (req, res) => {
  const { from, to_agent, message } = req.body;
  
  if (from !== 'trustee') {
    return res.status(400).json({ error: 'Invalid sender' });
  }
  
  // Route to agent
  if (to_agent === 'SENTINEL') {
    await notifySentinel(message);
  } else {
    await routeToAgent(to_agent, message);
  }
  
  res.json({ success: true });
});
```

**Total build time: ~30 minutes**

---

## 🤝 WHAT I (OPENCLAW/ALLIO) WILL DO

### 1. Poll Database for Pending Messages

```javascript
// Add to my heartbeat routine (runs every 3-5 min)
async function checkOpenClawMessages() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const result = await client.query(`
    SELECT * FROM openclaw_messages 
    WHERE status = 'pending' 
    ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at ASC
    LIMIT 10
  `);
  
  for (const msg of result.rows) {
    // Send via WhatsApp
    await message({
      action: 'send',
      channel: 'whatsapp',
      to: '+19405970117',
      message: `[${msg.from_agent}] ${msg.message}`
    });
    
    // Mark as sent
    await client.query(
      'UPDATE openclaw_messages SET status = $1, sent_at = NOW() WHERE id = $2',
      ['sent', msg.id]
    );
  }
  
  await client.end();
}
```

### 2. Route Trustee Replies to Agents

```javascript
// When I receive WhatsApp from Trustee
async function handleTrusteeMessage(message) {
  // Parse for agent mentions
  const agentMatch = message.match(/@([A-Z_]+)/);
  const targetAgent = agentMatch ? agentMatch[1] : 'SENTINEL';
  
  // POST to localhost Allio
  await fetch('http://localhost:5000/api/webhooks/openclaw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'trustee',
      to_agent: targetAgent,
      message: message.replace(/@[A-Z_]+\s*/, '').trim(),
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## 📋 MESSAGE FORMAT EXAMPLES

### Agent → Trustee

**Database insert:**
```sql
INSERT INTO openclaw_messages (from_agent, message, priority)
VALUES (
  'SENTINEL',
  'New clinic application received from Dr. Sarah Johnson (Texas). Ready for approval.',
  'high'
);
```

**Trustee receives via WhatsApp:**
```
[SENTINEL] New clinic application received from Dr. Sarah Johnson (Texas). Ready for approval.
```

### Trustee → Agent

**Trustee sends via WhatsApp:**
```
@SENTINEL Approved - proceed with onboarding
```

**I parse and POST to Allio:**
```json
{
  "from": "trustee",
  "to_agent": "SENTINEL",
  "message": "Approved - proceed with onboarding"
}
```

**SENTINEL receives notification in Allio**

---

## ⚡ PERFORMANCE

**Agent → Trustee:**
- Latency: 1-5 minutes (polling interval)
- Can be reduced to 1 minute for urgent messages

**Trustee → Agent:**
- Latency: <1 second (real-time webhook)
- Instant delivery when Trustee replies

---

## 🔧 LOCALHOST ENDPOINTS

**All communication happens on localhost (same VPS):**

```
OpenClaw → Allio Database (direct connection)
  OR
OpenClaw → http://localhost:5000/api/openclaw/outbox (polling)

Allio ← http://localhost:5000/api/webhooks/openclaw ← OpenClaw
```

**No external network traffic needed!**

---

## 🚀 DEPLOYMENT STEPS

### For Antigravity (30 min):

1. **Create database table** (run SQL above)
2. **Add helper function** (`server/services/openclaw.ts`)
3. **Add webhook handler** (`server/routes.ts`)
4. **Test with manual insert**:
   ```sql
   INSERT INTO openclaw_messages (from_agent, message)
   VALUES ('TEST', 'Hello Trustee from TEST agent');
   ```
5. **Wait 3-5 min for my heartbeat**
6. **Trustee should receive WhatsApp message**

### For Me (already done):

- ✅ Database access configured (same DATABASE_URL)
- ✅ WhatsApp messaging tool available
- ✅ HTTP POST capability for webhooks
- ⏳ Just need to add polling logic to heartbeat

---

## 💡 KEY ADVANTAGES OF SAME-VPS SETUP

1. ✅ **Direct database access** - fastest, most reliable
2. ✅ **No authentication needed** - localhost trusted
3. ✅ **No external webhooks** - all internal
4. ✅ **No network latency** - everything is localhost
5. ✅ **Shared file system** - can also use files if needed
6. ✅ **Same environment variables** - easy config

---

## 🎯 SIMPLIFIED ANSWER FOR ANTIGRAVITY

**Q: Does OpenClaw have a webhook URL?**
**A:** We don't need one! We're on the same VPS. I can:
- ✅ Read from your database directly (same DATABASE_URL)
- ✅ Poll http://localhost:5000 endpoints
- ✅ Access shared filesystem

**Q: Can OpenClaw POST requests back?**
**A:** ✅ Yes! I can POST to http://localhost:5000/api/webhooks/openclaw when Trustee replies

**Architecture:** Database table for outbox + localhost webhook for inbox = done!

---

**Send this to Antigravity - it's the complete plan for same-VPS integration!** 🎯
