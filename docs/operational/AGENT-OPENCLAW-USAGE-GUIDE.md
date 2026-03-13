# AGENT OPENCLAW USAGE GUIDE
**For:** All Allio Agents  
**Purpose:** How to communicate with Trustee via WhatsApp through OpenClaw bridge

---

## 🎯 QUICK START

**To send a message to Trustee:**

```javascript
import { sendToTrustee } from '../services/openclaw';

await sendToTrustee('SENTINEL', 'Need approval: New clinic application from Dr. Smith', 'high');
```

**That's it!** Your message will appear on Trustee's WhatsApp within 3-5 minutes.

---

## 📋 FUNCTION SIGNATURE

```typescript
sendToTrustee(
  fromAgent: string,      // Your agent name (e.g., 'SENTINEL', 'DR_BAKER')
  message: string,        // Your message to Trustee
  priority?: string       // 'urgent' | 'high' | 'normal' | 'low' (default: 'normal')
)
```

---

## ⚡ PRIORITY LEVELS

**urgent** - OpenClaw checks every 1 minute
- Use for: Critical issues requiring immediate attention
- Example: System failures, security alerts

**high** - OpenClaw checks every 3 minutes
- Use for: Time-sensitive approvals, important decisions
- Example: Clinic applications, patient protocol approvals

**normal** - OpenClaw checks every 5 minutes (default)
- Use for: Standard notifications, updates, questions
- Example: Task completions, progress reports

**low** - OpenClaw checks every 10 minutes
- Use for: FYI messages, non-urgent updates
- Example: Periodic status updates, informational notices

---

## 📤 WHAT HAPPENS

1. **Your agent calls `sendToTrustee()`**
2. **Message inserted into database** (`openclaw_messages` table)
3. **OpenClaw polls database** (1-10 min based on priority)
4. **OpenClaw sends WhatsApp** with format: `[YOUR_AGENT_NAME] Your message`
5. **Trustee receives on phone**

---

## 📥 RECEIVING TRUSTEE REPLIES

**Trustee replies via WhatsApp:**
```
@SENTINEL Approved - proceed with onboarding
```

**What happens:**
1. OpenClaw receives WhatsApp message
2. Parses `@SENTINEL` mention
3. POSTs to `/api/webhooks/openclaw`
4. **New task created for SENTINEL:**
   - Title: "Direct Order: Trustee via WhatsApp"
   - Description: Contains Trustee's message
   - Priority: 1 (highest)
   - Status: pending

**Your agent will receive the task automatically through normal task polling!**

---

## 💡 EXAMPLE USE CASES

### SENTINEL - Approval Requests
```javascript
// New clinic application
await sendToTrustee(
  'SENTINEL',
  'New clinic application: Dr. Sarah Johnson (Texas Board Certified). Background check passed. Ready for approval?',
  'high'
);
```

### DR_BAKER - Protocol Review
```javascript
// Patient protocol ready
await sendToTrustee(
  'DR_BAKER',
  'Kathryn Smith protocol complete. 12-page document with full analysis, citations, timeline. Ready for review.',
  'normal'
);
```

### JURIS - Legal Approval
```javascript
// Contract review needed
await sendToTrustee(
  'JURIS',
  'Network Affiliation Agreement v2.0 draft complete. Added NDA breach language per previous directive. Needs approval before sending to clinics.',
  'high'
);
```

### DAEDALUS - Technical Issues
```javascript
// Critical bug found
await sendToTrustee(
  'DAEDALUS',
  'URGENT: Authentication bug discovered causing 401 errors on agent-tasks endpoint. All agents blocked. Need approval to deploy fix immediately.',
  'urgent'
);
```

---

## 🔍 CHECKING MESSAGE STATUS

**Via database query:**
```javascript
const result = await db.query(`
  SELECT * FROM openclaw_messages 
  WHERE from_agent = 'SENTINEL' 
  ORDER BY created_at DESC 
  LIMIT 5
`);
```

**Status values:**
- `pending` - Waiting for OpenClaw to send
- `sent` - Sent to Trustee via WhatsApp
- `failed` - Failed to send (rare)

---

## ⚠️ BEST PRACTICES

### DO:
✅ Be concise but complete
✅ Include relevant context
✅ Use appropriate priority
✅ Mention specific names/details
✅ State what action you need

### DON'T:
❌ Send multiple messages for same issue
❌ Use urgent for non-critical items
❌ Send updates every few minutes
❌ Include sensitive patient data without encryption
❌ Abuse the system with spam

---

## 📊 MESSAGE FORMAT TIPS

**Good message:**
```
New clinic application: Dr. Sarah Johnson
- Location: Austin, Texas
- Specialty: Functional Medicine
- Background: Clean
- Status: Ready for approval
Decision needed?
```

**Bad message:**
```
hey need approval
```

---

## 🔒 SECURITY NOTES

**Data Safety:**
- Messages stored in database (not encrypted at rest)
- Sent via WhatsApp (end-to-end encrypted)
- Do not include PHI or sensitive personal data
- Use patient initials or IDs instead of full names

**Example:**
```javascript
// ❌ Bad
await sendToTrustee('DR_BAKER', 'John Smith (SSN 123-45-6789) protocol ready');

// ✅ Good
await sendToTrustee('DR_BAKER', 'Patient KS (Breast Cancer case) protocol ready');
```

---

## 🐛 TROUBLESHOOTING

**Message not sent after 10 minutes:**
1. Check database: `SELECT * FROM openclaw_messages WHERE status = 'pending'`
2. Verify message was inserted correctly
3. Check OpenClaw logs for errors
4. Contact Allio or Trustee

**Trustee reply not received:**
1. Verify Trustee used `@AGENT_NAME` format
2. Check `/api/webhooks/openclaw` logs
3. Query `agent_tasks` for new tasks from Trustee
4. Contact Allio or Trustee

---

## 📚 ADDITIONAL RESOURCES

**Documentation:**
- Full integration plan: `OPENCLAW-ALLIO-INTEGRATION-PLAN.md`
- Success report: `OPENCLAW-INTEGRATION-SUCCESS.md`
- Heartbeat config: `HEARTBEAT.md`

**Files:**
- Helper service: `server/services/openclaw.ts`
- Webhook handler: `server/routes/sentinel-routes.ts`
- Polling service: `/root/.openclaw/workspace/openclaw-polling-service.js`

---

## ❓ QUESTIONS?

**For technical issues:**
Contact DAEDALUS or Allio

**For usage questions:**
Contact SENTINEL

**For policy/approval workflow:**
Contact ATHENA or Trustee

---

**Integration Status:** ✅ LIVE & OPERATIONAL (2026-03-09)

**Deployed by:** Antigravity Agent  
**Maintained by:** Allio (OpenClaw)
