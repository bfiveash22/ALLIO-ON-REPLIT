try { require("dotenv/config"); } catch (_) {}
import { db } from '../../artifacts/api-server/src/db';
import { agentRegistry, agentTasks } from '../../lib/shared/src/schema';
import { eq, sql } from "drizzle-orm";

async function run() {
  console.log("Analyzing Database State...\n");
  
  // 1. Agent Counts by Name/ID
  const agents = await db.select({
    id: agentRegistry.id,
    name: agentRegistry.name,
    division: agentRegistry.division,
    count: sql<number>`count(*)`.as("cnt")
  }).from(agentRegistry)
  .groupBy(agentRegistry.id, agentRegistry.name, agentRegistry.division);

  console.log(`--- AGENT REGISTRY DUMP (${agents.length} unique models found, resolving >60 dashboard issue) ---`);
  const multiple = agents.filter(a => Number(a.count) > 1);
  if (multiple.length > 0) {
    console.log("DUPLICATES FOUND:");
    multiple.forEach(m => console.log(`- ${m.id} (${m.name}): ${m.count} rows`));
  } else {
    // Just map how many we have total and what they are
    console.log(`Total agents registered: ${agents.reduce((acc, curr) => acc + Number(curr.count), 0)}`);
  }
  console.log("\nFull List (first 50):", agents.map(a => a.id).sort().slice(0, 50).join(", "));
  
  // 2. DR_FORMULA tasks
  console.log("\n--- DR_FORMULA TASKS ---");
  const formulaTasks = await db.select({
    id: agentTasks.id,
    title: agentTasks.title,
    status: agentTasks.status,
    progress: agentTasks.progress,
    error: sql<string>`${agentTasks.outputUrl} IS NULL`
  }).from(agentTasks).where(eq(agentTasks.agentId, 'DR_FORMULA'));
  
  console.log(`Found ${formulaTasks.length} tasks for DR_FORMULA.`);
  formulaTasks.forEach(t => console.log(`- [${t.status}] (${t.progress}%) ${t.title || t.id}`));

  console.log("\n--- CHIRO TASKS ---");
  const chiroTasks = await db.select({
    title: agentTasks.title,
    status: agentTasks.status,
    progress: agentTasks.progress
  }).from(agentTasks).where(eq(agentTasks.agentId, 'CHIRO'));
  console.log(`Found ${chiroTasks.length} tasks for CHIRO.`);
  chiroTasks.forEach(t => console.log(`- [${t.status}] (${t.progress}%) ${t.title || 'unnamed'}`));

  process.exit(0);
}
run();
