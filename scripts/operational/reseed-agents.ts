try { require("dotenv/config"); } catch (_) {}
import { db } from "../server/db";
import { agentRegistry } from "../shared/schema";
import { agents } from "../shared/agents";

async function run() {
  console.log("Reseeding Agent Registry...\n");
  
  const canonicalAgents = [...agents];
  
  let inserted = 0;
  for (const agent of canonicalAgents) {
    try {
      await db.insert(agentRegistry).values({
        agentId: agent.id, // Maps to 'agent_id' column
        name: agent.name,
        division: agent.division as any,
        title: agent.title || "AI Agent",
        isActive: true,
      }).onConflictDoNothing(); // If it exists, skip
      inserted++;
    } catch (e: any) {
      console.log(`Failed to insert ${agent.id}: ${e.message}`);
    }
  }

  // Ensure DR_FORMULA and CHIRO are seeded if they aren't in the shared/agents list yet
  const extraAgents = [
    {
      agentId: "DR_FORMULA",
      name: "Dr. Formula",
      division: "support",
      title: "Patient Intake Protocol AI",
      isActive: true
    },
    {
      agentId: "CHIRO",
      name: "Chiro",
      division: "support",
      title: "Training Curriculum AI",
      isActive: true
    }
  ];

  for (const agent of extraAgents) {
    try {
      await db.insert(agentRegistry).values(agent as any).onConflictDoNothing();
      inserted++;
    } catch (e) {}
  }
  
  const all = await db.select({ id: agentRegistry.id }).from(agentRegistry);
  console.log(`Successfully reseeded ${inserted} agents. Database now holds exactly ${all.length} agents.`);
  process.exit(0);
}
run();
