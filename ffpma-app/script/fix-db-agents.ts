try { require("dotenv/config"); } catch (_) {}
import { db } from "../server/db";
import { agentRegistry, agentTasks, agentInteractions } from "../shared/schema";
import { eq, inArray, notInArray } from "drizzle-orm";
import { agents } from "../shared/agents";

async function run() {
  console.log("Fixing Database State...\n");
  
  // 1. Reset stuck DR_FORMULA & CHIRO Tasks
  console.log("Resetting stuck DR_FORMULA / CHIRO tasks...");
  await db.update(agentTasks)
    .set({ status: 'pending', progress: 0 })
    .where(inArray(agentTasks.agentId, ['DR_FORMULA', 'CHIRO']));
    
  // 2. Clear duplicate/ghost agents from registry
  // We only want the canonical 44+ agents defined in shared/agents.ts + DR_FORMULA + CHIRO
  const canonicalAgentIds = agents.map(a => a.id);
  // Ensure DR_FORMULA and CHIRO are in the canonical list if they aren't fully merged in shared/agents.ts yet
  if (!canonicalAgentIds.includes('DR_FORMULA')) canonicalAgentIds.push('DR_FORMULA');
  if (!canonicalAgentIds.includes('CHIRO')) canonicalAgentIds.push('CHIRO');

  console.log(`Canonical agent count should be: ${canonicalAgentIds.length}`);

  try {
    const deleted = await db.delete(agentRegistry)
      .where(notInArray(agentRegistry.name, canonicalAgentIds))
      .returning();
      
    console.log(`Deleted ${deleted.length} ghost/duplicate agents from the database registry.`);
  } catch (err: any) {
    console.log("Could not delete agents outright, likely due to foreign key constraints. Cleaning interactions first if necessary...");
    // If there are foreign key issues, we might need a more careful cleanup, but usually agentRegistry 
    // doesn't have strict relations enforcing deletion lock besides interactions.
    console.error(err.message);
  }

  // 3. Verify
  const remaining = await db.select({ id: agentRegistry.id }).from(agentRegistry);
  console.log(`Total agents remaining in dashboard: ${remaining.length} (Target: ~${canonicalAgentIds.length})`);

  process.exit(0);
}
run();
