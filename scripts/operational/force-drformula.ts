import { db } from '../../ffpma-app/server/db';
import { agentTasks } from '../../ffpma-app/shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { executeAgentTask } from '../../ffpma-app/server/services/agent-executor';

async function forceExecuteDrFormula() {
    console.log("=== EMERGENCY OVERRIDE: DR-FORMULA DEADLINE ===");
    try {
        const criticalTasks = await db.select().from(agentTasks)
            .where(and(eq(agentTasks.agentId, 'DR-FORMULA'), eq(agentTasks.priority, 0)));

        console.log(`Found ${criticalTasks.length} DR-FORMULA priority 0 tasks.`);

        if (criticalTasks.length === 0) {
            console.log("No critical DR-FORMULA tasks found.");
            process.exit(0);
        }

        for (const task of criticalTasks) {
            console.log(`[>>] Resetting task ${task.id} to ensure execution...`);
            await db.execute(sql`
                UPDATE agent_tasks SET status = 'pending', progress = 0
                WHERE id = ${task.id}
            `);

            console.log(`\n[>>] FORCING EXECUTION: "${task.title}"`);
            try {
                const result = await executeAgentTask(task.id);
                console.log(`[<<] RESULT: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[!!] EXECUTION CRASHED: ${message}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error("Fatal Script Error:", error);
        process.exit(1);
    }
}
forceExecuteDrFormula();
