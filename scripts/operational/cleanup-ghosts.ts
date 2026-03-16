import { db } from '../../artifacts/api-server/src/db';
import { agentTasks } from '../../lib/shared/src/schema';
import { inArray } from 'drizzle-orm';

async function cleanupGhostTasks() {
    console.log("Starting ghost task cleanup...");
    const ghostIds = ['TESLA', 'chief-science', 'TITAN', 'CHIEF_SCIENCE', 'CHIEF-SCIENCE', 'GAVEL', 'LEAD-ENGINEER', 'LEAD_ENGINEER', 'LEGAL-LEAD', 'LEGAL_LEAD'];

    try {
        const result = await db.delete(agentTasks).where(
            inArray(agentTasks.agentId, ghostIds)
        );
        console.log(`Deleted ghost tasks successfully.`);
    } catch (error) {
        console.error("Failed to delete ghost tasks:", error);
    }
    process.exit(0);
}

cleanupGhostTasks();
