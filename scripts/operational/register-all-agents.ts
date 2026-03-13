import { db } from '../../artifacts/api-server/src/db';
import { agentRegistry } from '../../lib/shared/src/schema';
import { agents } from '../../lib/shared/src/agents';
import { sql } from "drizzle-orm";

async function main() {
  console.log(`Starting registration of ${agents.length} agents into the database...`);

  let inserted = 0;
  let updated = 0;

  for (const agent of agents) {
    const uppercaseId = agent.id.toUpperCase();

    const existing = await db.query.agentRegistry.findFirst({
      where: (table, { eq }) => eq(table.agentId, uppercaseId)
    });

    if (existing) {
      await db.execute(sql`
        UPDATE agent_registry
        SET name = ${agent.name},
            title = ${agent.title},
            division = ${agent.division},
            specialty = ${agent.specialty},
            updated_at = NOW()
        WHERE agent_id = ${uppercaseId}
      `);
      updated++;
      console.log(`[UPDATE] ${agent.name} (${uppercaseId})`);
    } else {
      await db.execute(sql`
        INSERT INTO agent_registry (agent_id, name, title, division, specialty, is_active, is_lead)
        VALUES (
          ${uppercaseId},
          ${agent.name},
          ${agent.title},
          ${agent.division},
          ${agent.specialty || null},
          true,
          ${agent.division === 'executive' && agent.id === 'sentinel'}
        )
      `);
      inserted++;
      console.log(`[INSERT] ${agent.name} (${uppercaseId})`);
    }
  }

  console.log(`\nRegistration summary:`);
  console.log(`- Inserted: ${inserted}`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Total active agents in DB: ${inserted + updated}`);

  const allDbAgents = await db.query.agentRegistry.findMany();
  const validIds = agents.map(a => a.id.toUpperCase());

  const ghostDbAgents = allDbAgents.filter(a => !validIds.includes(String(a.agentId)));
  console.log(`\nFound ${ghostDbAgents.length} ghost agents in DB (not in code). We will deactivate them instead of deleting to preserve history.`);

  if (ghostDbAgents.length > 0) {
    const ghostDbAgentIds = ghostDbAgents.map(a => a.agentId);
    await db.execute(sql`
      UPDATE agent_registry SET is_active = false
      WHERE agent_id = ANY(${ghostDbAgentIds})
    `);
    console.log(`Deactivated ghost agents: ${ghostDbAgentIds.join(", ")}`);
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch(err => {
  console.error("Failed to register agents:", err);
  process.exit(1);
});
