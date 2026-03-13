---
name: allio-monitor
description: Monitor security tasks, track agent health across all divisions, detect failures and stalls, generate dashboard reports. Use when checking Allio agent network status, monitoring security implementation progress, investigating task failures, or generating status reports for Trustee. Critical for maintaining operational awareness of the 48-agent ecosystem.
---

# Allio Monitor

Monitor the Allio agent network health, security task progress, and operational status.

## Core Monitoring Tasks

### Check Agent Network Health

Query database for agent status across all divisions:

```javascript
import pg from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Get active agents by division
const agents = await client.query(`
  SELECT division, COUNT(*) as agent_count, 
         COUNT(CASE WHEN current_task_id IS NOT NULL THEN 1 END) as active_count
  FROM agent_registry
  WHERE is_active = true
  GROUP BY division
  ORDER BY division
`);

// Check for stalled tasks (>30 min no update, in_progress)
const stalled = await client.query(`
  SELECT agent_id, title, progress, 
         EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as stalled_minutes
  FROM agent_tasks
  WHERE status = 'in_progress'
    AND updated_at < NOW() - INTERVAL '30 minutes'
  ORDER BY updated_at ASC
`);

await client.end();
```

### Monitor Security Task Progress

Track the 10 security hardening tasks:

```javascript
const security = await client.query(`
  SELECT agent_id, title, status, priority, progress,
         EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours
  FROM agent_tasks
  WHERE title LIKE '%PRIORITY%' OR title LIKE '%CRITICAL%' OR title LIKE '%URGENT%'
    AND created_at > NOW() - INTERVAL '7 days'
  ORDER BY priority DESC, created_at ASC
`);
```

Group by priority level:
- Priority 10 (Critical): Report immediately if stalled
- Priority 9 (High): Alert if >24h without progress
- Priority 7-8 (Medium): Weekly summary

### Alert on Failures

Check for failed tasks and error patterns:

```javascript
const failures = await client.query(`
  SELECT agent_id, title, error_message, updated_at
  FROM agent_tasks
  WHERE status = 'failed'
    AND updated_at > NOW() - INTERVAL '24 hours'
  ORDER BY updated_at DESC
`);
```

Alert criteria:
- Any Priority 10 task fails → Immediate WhatsApp alert
- >3 tasks fail in same division → Division-wide issue alert
- Same agent fails >2 tasks → Agent debugging needed

### Generate Dashboard Reports

Create formatted status reports:

```markdown
# Allio Network Status Report
**Date:** {timestamp}

## Agent Health Summary
- Total Active Agents: {count}
- Currently Working: {active_count}
- Idle: {idle_count}
- Stalled (>30 min): {stalled_count}

## Division Status
{for each division}
- {Division}: {agent_count} agents, {active_count} active, {completed_today} completed today

## Security Hardening Progress
**Priority 1 (24h deadline):**
- Cloudflare WAF: {status} ({progress}%)
- CSRF Protection: {status} ({progress}%)
- 2FA Implementation: {status} ({progress}%)

**Priority 2 (7 days):**
- Automated Backups: {status} ({progress}%)
- SSH Hardening: {status} ({progress}%)

## Alerts
{if failures}
⚠️ {count} failures in last 24h:
{list failures}

{if stalled}
🔄 {count} stalled tasks:
{list stalled tasks}
```

## Monitoring Schedule

**Continuous (every 5 min):**
- Check for Priority 10 task failures
- Detect new stalled tasks

**Hourly:**
- Agent health summary
- Security task progress

**Daily (9 AM UTC):**
- Full dashboard report to Trustee
- Yesterday's completion summary
- Today's upcoming deadlines

**Weekly (Monday 9 AM UTC):**
- Full week retrospective
- Agent performance metrics
- Security posture assessment

## Database Schema

**Key Tables:**
- `agent_registry` - Active agents, capabilities
- `agent_tasks` - All tasks (pending, in_progress, completed, failed)
- `agent_locks` - Current task assignments

**Key Fields:**
- `status` - pending, in_progress, completed, failed
- `priority` - 1-10 (10 = critical)
- `progress` - 0-100%
- `updated_at` - Last activity timestamp
- `error_message` - Failure reason

## Alert Integration

Send alerts via:
- WhatsApp (critical failures, security breaches)
- Daily summary (morning briefing)
- On-demand (when Trustee asks for status)

Use `message` tool for WhatsApp alerts.

## Scripts

See `scripts/` directory for executable monitoring scripts:
- `check-health.js` - Agent network health
- `security-progress.js` - Security task tracker
- `stalled-detector.js` - Find stuck tasks
- `daily-report.js` - Generate dashboard
