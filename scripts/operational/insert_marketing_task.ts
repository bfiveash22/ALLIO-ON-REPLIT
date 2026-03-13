import { db } from '../../ffpma-app/server/db';
import { agentRegistry } from '../../ffpma-app/shared/schema';
import { eq, sql } from "drizzle-orm";

async function insertTask() {
    console.log("Checking for marketing agents...");
    try {
        const agents = await db.select().from(agentRegistry).where(eq(agentRegistry.division, "marketing"));

        let targetAgentId = "MUSE";
        if (agents.length > 0) {
            targetAgentId = String(agents[0].agentId);
            console.log(`Found marketing agent: ${targetAgentId}`);
        } else {
            console.log("No marketing agent found in registry, defaulting to 'MUSE'.");
        }

        const taskDescription =
            "1. The opening video on the landing page (allio_logo_reveal_1080p.mp4) spells 'ecosystem' wrong. Recreate it with better quality and updated text.\n" +
            "2. URGENT: Audit all early/old media files in the system, recreate them with higher quality, and dispose of the old files to clean up the system and lighten the load for scaling.";

        console.log("Inserting task...");
        const result = await db.execute(sql`
            INSERT INTO agent_tasks (agent_id, division, title, description, status, priority, assigned_by)
            VALUES (${targetAgentId}, 'marketing', 'Recreate Early Media & Fix Logo Reveal Video', ${taskDescription}, 'pending', 1, 'admin_request')
            RETURNING id
        `);

        console.log("Successfully inserted task:", result.rows?.[0]);
    } catch (err) {
        console.error("Error inserting task:", err);
    } finally {
        process.exit(0);
    }
}

insertTask();
