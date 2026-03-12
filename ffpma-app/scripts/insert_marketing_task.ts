import { db } from "../server/db";
import { agentTasks, agentRegistry } from "../shared/schema";
import { eq } from "drizzle-orm";

async function insertTask() {
    console.log("Checking for marketing agents...");
    try {
        const agents = await db.select().from(agentRegistry).where(eq(agentRegistry.division, "marketing"));

        let targetAgentId = "MUSE"; // Default agent
        if (agents.length > 0) {
            targetAgentId = agents[0].agentId;
            console.log(`Found marketing agent: ${targetAgentId}`);
        } else {
            console.log("No marketing agent found in registry, defaulting to 'MUSE'.");
        }

        const taskDescription =
            "1. The opening video on the landing page (allio_logo_reveal_1080p.mp4) spells 'ecosystem' wrong. Recreate it with better quality and updated text.\n" +
            "2. URGENT: Audit all early/old media files in the system, recreate them with higher quality, and dispose of the old files to clean up the system and lighten the load for scaling.";

        console.log("Inserting task...");
        const [insertedTask] = await db.insert(agentTasks).values({
            agentId: targetAgentId,
            division: "marketing",
            title: "Recreate Early Media & Fix Logo Reveal Video",
            description: taskDescription,
            status: "pending",
            priority: 1, // High priority
            assignedBy: "admin_request",
        }).returning();

        console.log("Successfully inserted task:", insertedTask.id);
    } catch (err) {
        console.error("Error inserting task:", err);
    } finally {
        process.exit(0);
    }
}

insertTask();
