import { db } from "./server/db";
import { agentTasks } from "./server/db/schema";
import { inArray, eq, and, or } from "drizzle-orm";

async function cancelLowPriorityTasks() {
    console.log("Cancelling low priority tasks for HIPPOCRATES, PARACELSUS, PROMETHEUS and chief-science ghosts...");

    try {
        const result = await db.update(agentTasks)
            .set({
                status: "failed",
                notes: "Cancelled by ANTIGRAVITY to free up OpenAI token limits for Priority 0 DR-FORMULA tasks."
            })
            .where(
                and(
                    or(
                        eq(agentTasks.status, "in_progress"),
                        eq(agentTasks.status, "pending")
                    ),
                    inArray(agentTasks.agentId, ["hippocrates", "paracelsus", "prometheus", "chief-science"])
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
