import { db } from '../../ffpma-app/server/db';
import { agentTasks } from '../../ffpma-app/shared/schema';
import { sql } from "drizzle-orm";

async function cancelLowPriorityTasks() {
    console.log("Cancelling low priority tasks for HIPPOCRATES, PARACELSUS, PROMETHEUS and chief-science ghosts...");

    try {
        const result = await db.execute(sql`
            UPDATE agent_tasks
            SET status = 'failed',
                notes = 'Cancelled manually by ANTIGRAVITY to free up OpenAI tokens for Priority 0 DR-FORMULA tasks.'
            WHERE (status = 'in_progress' OR status = 'pending')
            AND agent_id IN ('hippocrates', 'HIPPOCRATES', 'paracelsus', 'PARACELSUS', 'prometheus', 'PROMETHEUS', 'chief-science', 'CHIEF-SCIENCE')
            RETURNING id
        `);

        console.log(`Successfully cancelled ${result.rowCount} tasks.`);
        process.exit(0);
    } catch (error) {
        console.error("Error cancelling tasks:", error);
        process.exit(1);
    }
}

cancelLowPriorityTasks();
