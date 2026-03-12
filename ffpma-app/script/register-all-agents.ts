import { db } from "../server/db";
import { agentRegistry } from "../shared/schema";
import { agents } from "../shared/agents";

async function main() {
  console.log(`Starting registration of ${agents.length} agents into the database...`);
  
  let inserted = 0;
  let updated = 0;

  for (const agent of agents) {
    const uppercaseId = agent.id.toUpperCase();
    
    // Check if agent exists
    const existing = await db.query.agentRegistry.findFirst({
      where: (table, { eq }) => eq(table.agentId, uppercaseId)
    });

    if (existing) {
      // Update
      const { eq } = await import("drizzle-orm");
      await db.update(agentRegistry).set({
        name: agent.name,
        title: agent.title,
        division: agent.division,
        specialty: agent.specialty,
        updatedAt: new Date()
      }).where(eq(agentRegistry.agentId, uppercaseId));
      
      updated++;
      console.log(`[UPDATE] ${agent.name} (${uppercaseId})`);
    } else {
      // Insert
      await db.insert(agentRegistry).values({
        agentId: uppercaseId,
        name: agent.name,
        title: agent.title,
        division: agent.division,
        specialty: agent.specialty || null,
        isActive: true,
        isLead: agent.division === 'executive' && agent.id === 'sentinel' ? true : false,
      });
      inserted++;
      console.log(`[INSERT] ${agent.name} (${uppercaseId})`);
    }
  }

  console.log(`\nRegistration summary:`);
  console.log(`- Inserted: ${inserted}`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Total active agents in DB: ${inserted + updated}`);
  
  // Now let's list the agents currently in DB but NOT in the code (the 18 old agents)
  const allDbAgents = await db.query.agentRegistry.findMany();
  const validIds = agents.map(a => a.id.toUpperCase());
  
  const ghostDbAgents = allDbAgents.filter(a => !validIds.includes(a.agentId));
  console.log(`\nFound ${ghostDbAgents.length} ghost agents in DB (not in code). We will deactivate them instead of deleting to preserve history.`);
  
  if (ghostDbAgents.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const ghostDbAgentIds = ghostDbAgents.map(a => a.agentId);
    await db.update(agentRegistry).set({ isActive: false }).where(inArray(agentRegistry.agentId, ghostDbAgentIds));
    console.log(`Deactivated ghost agents: ${ghostDbAgentIds.join(", ")}`);
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch(err => {
  console.error("Failed to register agents:", err);
  process.exit(1);
});
