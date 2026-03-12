#!/usr/bin/env node
// Security Task Progress Tracker
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '/root/allio-v1/.env' });
const { Client } = pg;

async function securityProgress() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const tasks = await client.query(`
    SELECT agent_id, title, status, priority, progress,
           EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours,
           EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as idle_minutes
    FROM agent_tasks
    WHERE (title LIKE '%PRIORITY%' OR title LIKE '%CRITICAL%' OR title LIKE '%URGENT%')
      AND title LIKE '%Security%' OR title LIKE '%CSRF%' OR title LIKE '%2FA%' 
         OR title LIKE '%Cloudflare%' OR title LIKE '%SSH%' OR title LIKE '%Backup%'
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY priority DESC, created_at ASC
  `);

  await client.end();

  console.log('🔒 SECURITY HARDENING PROGRESS\n');

  const byPriority = { 10: [], 9: [], 8: [], 7: [] };
  tasks.rows.forEach(t => {
    if (byPriority[t.priority]) byPriority[t.priority].push(t);
  });

  Object.keys(byPriority).sort((a, b) => b - a).forEach(priority => {
    const tasks = byPriority[priority];
    if (tasks.length === 0) return;

    console.log(`Priority ${priority}:`);
    tasks.forEach(t => {
      const status = t.status === 'completed' ? '✅' :
                     t.status === 'in_progress' ? '🔄' :
                     t.status === 'failed' ? '❌' : '⏳';
      console.log(`  ${status} ${t.agent_id}: ${t.title.substring(0, 50)}...`);
      console.log(`      ${t.progress}% | Age: ${Math.floor(t.age_hours)}h | Idle: ${Math.floor(t.idle_minutes)}m`);
    });
    console.log();
  });
}

securityProgress().catch(console.error);
