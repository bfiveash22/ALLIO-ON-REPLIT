import { db } from '../server/db.ts';
import { agentTasks } from '../shared/schema.ts';
import { inArray, eq, and, or } from "drizzle-orm";

async function cancelLowPriorityTasks() {
    console.log("Cancelling low priority tasks for HIPPOCRATES, PARACELSUS, PROMETHEUS and chief-science ghosts...");

    try {
        const result = await db.update(agentTasks)
            .set({
                status: "failed",
                notes: "Cancelled manually by ANTIGRAVITY to free up OpenAI tokens for Priority 0 DR-FORMULA tasks."
            })
            .where(
                and(
                    or(
                        eq(agentTasks.status, "in_progress"),
                        eq(agentTasks.status, "pending")
                    ),
                    inArray(agentTasks.agentId, [
                        "hippocrates", "HIPPOCRATES",
                        "paracelsus", "PARACELSUS",
                        "prometheus", "PROMETHEUS",
                        "chief-science", "CHIEF-SCIENCE"
                    ])
                )
            )
            .returning();

        console.log(`Successfully cancelled ${result.length} tasks.`);
        process.exit(0);
    } catch (error) {
        console.error("Error cancelling tasks:", error);
        process.exit(1);
    }
}

cancelLowPriorityTasks();
