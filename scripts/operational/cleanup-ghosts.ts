import { db } from '../../ffpma-app/server/db';
import { agentTasks } from '../../ffpma-app/shared/schema';
import { inArray } from 'drizzle-orm';

async function cleanupGhostTasks() {
    console.log("Starting ghost task cleanup...");
    const ghostIds = ['TESLA', 'DR_FORMULA', 'chief-science', 'TITAN', 'DR_TRIAGE', 'CHIEF_SCIENCE', 'CHIEF-SCIENCE'];

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
