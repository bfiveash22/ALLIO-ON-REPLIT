try { require("dotenv/config"); } catch (_) {}
  import { db } from "../server/db";
  import { agentRegistry, agentTasks, agentInteractions } from "../shared/schema";
  import { eq, inArray, notInArray, sql } from "drizzle-orm";
  import { agents } from "../shared/agents";
  
  async function run() {
    console.log("Fixing Database State...\n");
  
    const canonicalAgentIds = agents.map(a => a.id.toUpperCase());
    console.log(`Canonical agent count: ${canonicalAgentIds.length} (expected: 46)`);
  
    // 1. Reset stuck tasks for agents that use hyphens in IDs
    console.log("Resetting stuck tasks for hyphenated agent IDs...");
    const hyphenAgents = agents.filter(a => a.id.includes('-')).map(a => a.id.toUpperCase());
    if (hyphenAgents.length > 0) {
      await db.update(agentTasks)
        .set({ status: 'pending', progress: 0 })
        .where(inArray(agentTasks.agentId, hyphenAgents));
    }
  
    // 2. Clear ghost agents from registry (any agent NOT in agents.ts)
    console.log("Removing ghost/duplicate agents from registry...");
    try {
      const allRegistered = await db.select({ agentId: agentRegistry.agentId }).from(agentRegistry);
      const ghostIds = allRegistered
        .filter(r => !canonicalAgentIds.includes(r.agentId.toUpperCase()))
        .map(r => r.agentId);
  
      if (ghostIds.length > 0) {
        console.log(`Found ${ghostIds.length} ghost agents: ${ghostIds.join(', ')}`);
        const deleted = await db.delete(agentRegistry)
          .where(inArray(agentRegistry.agentId, ghostIds))
          .returning();
        console.log(`Deleted ${deleted.length} ghost agents from the database registry.`);
      } else {
        console.log("No ghost agents found.");
      }
    } catch (err: any) {
      console.error("Error cleaning ghost agents:", err.message);
    }
  
    // 3. Verify
    const remaining = await db.select({ id: agentRegistry.id }).from(agentRegistry);
    console.log(`Total agents remaining in dashboard: ${remaining.length} (Target: ${canonicalAgentIds.length})`);
  
    process.exit(0);
  }
  run();
  