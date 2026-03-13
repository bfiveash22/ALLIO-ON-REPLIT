#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '/root/allio-v1/.env' });
const { Client } = pg;

async function detectStalled() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const stalled = await client.query(`
    SELECT agent_id, title, status, priority, progress,
           EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as stalled_minutes,
           EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours
    FROM agent_tasks
    WHERE status = 'in_progress'
      AND updated_at < NOW() - INTERVAL '30 minutes'
    ORDER BY priority DESC, updated_at ASC
  `);

  const critical = stalled.rows.filter(t => t.priority >= 9);
  const warning = stalled.rows.filter(t => t.priority >= 7 && t.priority < 9);
  const info = stalled.rows.filter(t => t.priority < 7);

  await client.end();

  console.log('🔍 STALLED TASK DETECTOR\n');

  if (stalled.rows.length === 0) {
    console.log('✅ No stalled tasks detected');
    process.exit(0);
  }

  console.log(`⚠️  ${stalled.rows.length} stalled tasks found\n`);

  if (critical.length > 0) {
    console.log(`🚨 CRITICAL (Priority 9-10): ${critical.length} tasks`);
    critical.forEach(t => {
      console.log(`  ${t.agent_id}: ${t.title.substring(0, 60)}`);
      console.log(`    Priority: ${t.priority} | Progress: ${t.progress}% | Stalled: ${Math.floor(t.stalled_minutes)}m | Age: ${Math.floor(t.age_hours)}h`);
    });
    console.log();
  }

  if (warning.length > 0) {
    console.log(`⚠️  WARNING (Priority 7-8): ${warning.length} tasks`);
    warning.forEach(t => {
      console.log(`  ${t.agent_id}: ${t.title.substring(0, 60)}`);
      console.log(`    Priority: ${t.priority} | Progress: ${t.progress}% | Stalled: ${Math.floor(t.stalled_minutes)}m | Age: ${Math.floor(t.age_hours)}h`);
    });
    console.log();
  }

  if (info.length > 0) {
    console.log(`ℹ️  INFO (Priority 1-6): ${info.length} tasks`);
    info.forEach(t => {
      console.log(`  ${t.agent_id}: ${t.title.substring(0, 60)}`);
      console.log(`    Priority: ${t.priority} | Progress: ${t.progress}% | Stalled: ${Math.floor(t.stalled_minutes)}m | Age: ${Math.floor(t.age_hours)}h`);
    });
    console.log();
  }

  if (critical.length > 0) {
    process.exit(2);
  } else if (warning.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

detectStalled().catch(err => {
  console.error('❌ Stalled detector failed:', err.message);
  process.exit(2);
});
