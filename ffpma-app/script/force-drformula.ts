import { db } from '../server/db';
import { agentTasks } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { executeAgentTask } from '../server/services/agent-executor';

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
            await db.update(agentTasks).set({ status: 'pending', progress: 0 }).where(eq(agentTasks.id, task.id));

            console.log(`\\n[>>] FORCING EXECUTION: "${task.title}"`);
            try {
                const result = await executeAgentTask(task.id);
                console.log(`[<<] RESULT: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
            } catch (err: any) {
                console.error(`[!!] EXECUTION CRASHED: ${err.message}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error("Fatal Script Error:", error);
        process.exit(1);
    }
}
forceExecuteDrFormula();
