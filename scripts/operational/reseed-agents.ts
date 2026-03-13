import { db } from '../../artifacts/api-server/src/db';
import { agentRegistry } from '../../lib/shared/src/schema';
import { agents } from '../../lib/shared/src/agents';
import { sql } from "drizzle-orm";

async function run() {
  console.log("Reseeding Agent Registry...\n");

  let inserted = 0;
  for (const agent of agents) {
    const uppercaseId = agent.id.toUpperCase();
    try {
      const result = await db.execute(sql`
        INSERT INTO agent_registry (agent_id, name, division, title, is_active)
        VALUES (${uppercaseId}, ${agent.name}, ${agent.division}, ${agent.title || "AI Agent"}, true)
        ON CONFLICT DO NOTHING
      `);
      if (result.rowCount && result.rowCount > 0) {
        inserted++;
        console.log(`[INSERT] ${agent.name} (${uppercaseId})`);
      } else {
        console.log(`[SKIP]   ${agent.name} (${uppercaseId}) — already exists`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`[FAIL]   ${agent.id}: ${message}`);
    }
  }

  const extraAgents = [
    { agentId: "DR_FORMULA", name: "Dr. Formula", division: "support", title: "Patient Intake Protocol AI" },
    { agentId: "CHIRO", name: "Chiro", division: "support", title: "Training Curriculum AI" }
  ];

  for (const agent of extraAgents) {
    try {
      const result = await db.execute(sql`
        INSERT INTO agent_registry (agent_id, name, division, title, is_active)
        VALUES (${agent.agentId}, ${agent.name}, ${agent.division}, ${agent.title}, true)
        ON CONFLICT DO NOTHING
      `);
      if (result.rowCount && result.rowCount > 0) {
        inserted++;
        console.log(`[INSERT] ${agent.name} (${agent.agentId})`);
      } else {
        console.log(`[SKIP]   ${agent.name} (${agent.agentId}) — already exists`);
      }
    } catch (_) {}
  }

  const all = await db.select({ id: agentRegistry.id }).from(agentRegistry);
  console.log(`\nInserted ${inserted} new agents. Database now holds ${all.length} agents total.`);
  process.exit(0);
}
run();
