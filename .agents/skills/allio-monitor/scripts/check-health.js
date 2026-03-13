#!/usr/bin/env node
// Allio Agent Network Health Check
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '/root/allio-v1/.env' });
const { Client } = pg;

async function checkHealth() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Get agent counts by division
  const divisions = await client.query(`
    SELECT division, COUNT(*) as total,
           COUNT(CASE WHEN current_task_id IS NOT NULL THEN 1 END) as active
    FROM agent_registry
    WHERE is_active = true
    GROUP BY division
    ORDER BY division
  `);

  // Get stalled tasks
  const stalled = await client.query(`
    SELECT agent_id, title, progress,
           EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stalled
    FROM agent_tasks
    WHERE status = 'in_progress'
      AND updated_at < NOW() - INTERVAL '30 minutes'
    ORDER BY updated_at ASC
  `);

  // Get recent failures
  const failures = await client.query(`
    SELECT agent_id, title, error_message
    FROM agent_tasks
    WHERE status = 'failed'
      AND updated_at > NOW() - INTERVAL '24 hours'
  `);

  await client.end();

  // Output results
  console.log('🏥 ALLIO NETWORK HEALTH CHECK\n');
  console.log('Division Status:');
  divisions.rows.forEach(d => {
    console.log(`  ${d.division.padEnd(15)} ${d.active}/${d.total} active`);
  });

  if (stalled.rows.length > 0) {
    console.log(`\n⚠️  ${stalled.rows.length} Stalled Tasks:`);
    stalled.rows.forEach(t => {
      console.log(`  ${t.agent_id}: ${t.title.substring(0, 50)}... (${Math.floor(t.minutes_stalled)}m)`);
    });
  } else {
    console.log('\n✅ No stalled tasks');
  }

  if (failures.rows.length > 0) {
    console.log(`\n❌ ${failures.rows.length} Failures (24h):`);
    failures.rows.forEach(f => {
      console.log(`  ${f.agent_id}: ${f.title.substring(0, 50)}...`);
      if (f.error_message) console.log(`    Error: ${f.error_message.substring(0, 80)}...`);
    });
  } else {
    console.log('✅ No failures in last 24 hours');
  }

  // Exit code based on health
  if (failures.rows.length > 0 || stalled.rows.length > 5) {
    process.exit(1); // Unhealthy
  } else {
    process.exit(0); // Healthy
  }
}

checkHealth().catch(console.error);
