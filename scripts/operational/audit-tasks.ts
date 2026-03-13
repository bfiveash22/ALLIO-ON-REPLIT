import { db } from '../server/db.ts';
import { agentTasks } from '../shared/schema.ts';
import { eq, gte, and, ne } from 'drizzle-orm';

async function run() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Find completed tasks in last 24h
  const completed = await db.select().from(agentTasks).where(
    and(
      eq(agentTasks.status, 'completed'),
      gte(agentTasks.updatedAt, last24h)
    )
  );
  
  console.log(`--- Completed Tasks in Last 24h (${completed.length}) ---`);
  completed.forEach(t => {
    console.log(`[${t.agentId}] ${t.title}`);
    console.log(`Output: ${t.outputUrl || 'None'}`);
    console.log(`Verified: ${t.evidenceVerified ? 'Yes' : 'No'}\n`);
  });

  // Find tasks that failed or are pending without output
  const pending = await db.select().from(agentTasks).where(
    and(
      ne(agentTasks.status, 'completed'),
      gte(agentTasks.updatedAt, last24h)
    )
  );

  console.log(`--- Pending/In-Progress Tasks in Last 24h (${pending.length}) ---`);
  pending.forEach(t => {
    console.log(`[${t.agentId}] Status: ${t.status} | Title: ${t.title}`);
  });

  process.exit(0);
}

run().catch(console.error);
