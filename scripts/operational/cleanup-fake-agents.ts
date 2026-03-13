import { db } from '../../ffpma-app/server/db';
import { agentTasks, openclawMessages } from '../../ffpma-app/shared/schema';
import { inArray } from "drizzle-orm";
import { agents } from '../../ffpma-app/shared/agents';

async function main() {
  const validAgentIds = agents.map(a => a.id);
  // Also add 'SENTINEL' since it might be capitalized sometimes in the DB
  validAgentIds.push("SENTINEL", "DR_FORMULA", "dr-formula", "DR. FORMULA", "DR. BAKER", "dr. baker");

  console.log("Valid agents count:", validAgentIds.length);
  
  const allTasks = await db.select().from(agentTasks);
  const invalidTasks = allTasks.filter(t => t.agentId && !validAgentIds.includes(t.agentId) && !validAgentIds.includes(t.agentId.toLowerCase()));
  
  console.log(`Found ${invalidTasks.length} tasks assigned to invalid agents.`);
  for (const t of invalidTasks) {
    console.log(`- Task ${t.id} assigned to: ${t.agentId}`);
  }
  
  if (invalidTasks.length > 0) {
    const idsToDelete = invalidTasks.map(t => t.id);
    await db.delete(agentTasks).where(inArray(agentTasks.id, idsToDelete));
    console.log("Deleted invalid tasks from agentTasks.");
  }
  
  const allMessages = await db.select().from(openclawMessages);
  const invalidMessages = allMessages.filter(m => m.fromAgent && !validAgentIds.includes(m.fromAgent) && !validAgentIds.includes(m.fromAgent.toLowerCase()));
  
  console.log(`Found ${invalidMessages.length} openclaw messages from invalid agents.`);
  if (invalidMessages.length > 0) {
     const msgIdsToDelete = invalidMessages.map(m => m.id);
     await db.delete(openclawMessages).where(inArray(openclawMessages.id, msgIdsToDelete));
     console.log("Deleted invalid messages from openclawMessages.");
  }
  
  console.log("Cleanup Done.");
  process.exit(0);
}

main().catch(console.error);
