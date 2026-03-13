try { require("dotenv/config"); } catch (_) {}
import { db } from '../../artifacts/api-server/src/db';
import { agentRegistry } from '../../lib/shared/src/schema';
import { notInArray } from "drizzle-orm";
import { agents } from '../../lib/shared/src/agents';
import { sql } from "drizzle-orm";

async function run() {
  console.log("Fixing Database State...\n");
  
  console.log("Resetting stuck DR_FORMULA / CHIRO tasks...");
  await db.execute(sql`
    UPDATE agent_tasks
    SET status = 'pending', progress = 0
    WHERE agent_id IN ('DR_FORMULA', 'CHIRO')
  `);
    
  const canonicalAgentIds = agents.map(a => a.id);
  if (!canonicalAgentIds.includes('DR_FORMULA')) canonicalAgentIds.push('DR_FORMULA');
  if (!canonicalAgentIds.includes('CHIRO')) canonicalAgentIds.push('CHIRO');

  console.log(`Canonical agent count should be: ${canonicalAgentIds.length}`);

  try {
    const deleted = await db.delete(agentRegistry)
      .where(notInArray(agentRegistry.agentId, canonicalAgentIds))
      .returning();
      
    console.log(`Deleted ${deleted.length} ghost/duplicate agents from the database registry.`);
  } catch (err) {
    console.log("Could not delete agents outright, likely due to foreign key constraints. Cleaning interactions first if necessary...");
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
  }

  const remaining = await db.select({ id: agentRegistry.id }).from(agentRegistry);
  console.log(`Total agents remaining in dashboard: ${remaining.length} (Target: ~${canonicalAgentIds.length})`);

  process.exit(0);
}
run();
