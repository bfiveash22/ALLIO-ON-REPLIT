#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '/root/allio-v1/.env' });
const { Client } = pg;

async function generateDailyReport() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const divisions = await client.query(`
    SELECT division, COUNT(*) as total,
           COUNT(CASE WHEN current_task_id IS NOT NULL THEN 1 END) as active
    FROM agent_registry
    WHERE is_active = true
    GROUP BY division
    ORDER BY division
  `);

  const taskSummary = await client.query(`
    SELECT status, COUNT(*) as count
    FROM agent_tasks
    WHERE updated_at > NOW() - INTERVAL '24 hours'
    GROUP BY status
  `);

  const completedToday = await client.query(`
    SELECT agent_id, title, priority,
           EXTRACT(EPOCH FROM (updated_at - created_at))/3600 as duration_hours
    FROM agent_tasks
    WHERE status = 'completed'
      AND updated_at > NOW() - INTERVAL '24 hours'
    ORDER BY updated_at DESC
  `);

  const stalled = await client.query(`
    SELECT agent_id, title, progress,
           EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as stalled_minutes
    FROM agent_tasks
    WHERE status = 'in_progress'
      AND updated_at < NOW() - INTERVAL '30 minutes'
    ORDER BY updated_at ASC
  `);

  const failures = await client.query(`
    SELECT agent_id, title, error_message
    FROM agent_tasks
    WHERE status = 'failed'
      AND updated_at > NOW() - INTERVAL '24 hours'
  `);

  const securityTasks = await client.query(`
    SELECT agent_id, title, status, priority, progress
    FROM agent_tasks
    WHERE (title LIKE '%Security%' OR title LIKE '%CSRF%' OR title LIKE '%2FA%'
           OR title LIKE '%Cloudflare%' OR title LIKE '%SSH%' OR title LIKE '%Backup%')
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY priority DESC
  `);

  await client.end();

  const totalAgents = divisions.rows.reduce((sum, d) => sum + parseInt(d.total), 0);
  const activeAgents = divisions.rows.reduce((sum, d) => sum + parseInt(d.active), 0);
  const statusMap = {};
  taskSummary.rows.forEach(r => { statusMap[r.status] = parseInt(r.count); });

  const report = [];
  report.push('# Allio Network Status Report');
  report.push(`**Date:** ${new Date().toISOString().split('T')[0]} ${new Date().toISOString().split('T')[1].substring(0, 5)} UTC\n`);

  report.push('## Agent Health Summary');
  report.push(`- Total Active Agents: ${totalAgents}`);
  report.push(`- Currently Working: ${activeAgents}`);
  report.push(`- Idle: ${totalAgents - activeAgents}`);
  report.push(`- Stalled (>30 min): ${stalled.rows.length}\n`);

  report.push('## Division Status');
  divisions.rows.forEach(d => {
    report.push(`- **${d.division}**: ${d.total} agents, ${d.active} active`);
  });
  report.push('');

  report.push('## Task Activity (24h)');
  report.push(`- Completed: ${statusMap.completed || 0}`);
  report.push(`- In Progress: ${statusMap.in_progress || 0}`);
  report.push(`- Failed: ${statusMap.failed || 0}`);
  report.push(`- Pending: ${statusMap.pending || 0}\n`);

  if (completedToday.rows.length > 0) {
    report.push('## Completed Today');
    completedToday.rows.forEach(t => {
      report.push(`- ✅ ${t.agent_id}: ${t.title.substring(0, 60)} (${Math.round(t.duration_hours)}h)`);
    });
    report.push('');
  }

  if (securityTasks.rows.length > 0) {
    report.push('## Security Hardening Progress');
    securityTasks.rows.forEach(t => {
      const icon = t.status === 'completed' ? '✅' :
                   t.status === 'in_progress' ? '🔄' :
                   t.status === 'failed' ? '❌' : '⏳';
      report.push(`- ${icon} [P${t.priority}] ${t.title.substring(0, 50)} (${t.progress}%)`);
    });
    report.push('');
  }

  report.push('## Alerts');
  if (failures.rows.length > 0) {
    report.push(`⚠️ ${failures.rows.length} failures in last 24h:`);
    failures.rows.forEach(f => {
      report.push(`- ❌ ${f.agent_id}: ${f.title.substring(0, 50)}`);
      if (f.error_message) report.push(`  Error: ${f.error_message.substring(0, 80)}`);
    });
  } else {
    report.push('✅ No failures in last 24 hours');
  }

  if (stalled.rows.length > 0) {
    report.push(`\n🔄 ${stalled.rows.length} stalled tasks:`);
    stalled.rows.forEach(t => {
      report.push(`- ${t.agent_id}: ${t.title.substring(0, 50)} (${Math.floor(t.stalled_minutes)}m stalled, ${t.progress}%)`);
    });
  } else {
    report.push('✅ No stalled tasks');
  }

  console.log(report.join('\n'));

  if (failures.rows.length > 0 || stalled.rows.length > 5) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

generateDailyReport().catch(err => {
  console.error('❌ Daily report generation failed:', err.message);
  process.exit(2);
});
