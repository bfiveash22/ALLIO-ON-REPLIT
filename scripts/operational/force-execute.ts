import { db } from '../../artifacts/api-server/src/db';
import { agentTasks } from '../../lib/shared/src/schema';
import { eq, or, and, sql } from 'drizzle-orm';
import { executeAgentTask } from '../../artifacts/api-server/src/services/agent-executor';

async function forceExecutePriorityTasks() {
    console.log("=== EMERGENCY OVERRIDE: INITIATING PRIORITY 0 TASK EXECUTION ===");

    try {
        const criticalTasks = await db.select().from(agentTasks)
            .where(
                and(
                    or(
                        eq(agentTasks.status, 'pending'),
                        eq(agentTasks.status, 'in_progress')
                    ),
                    or(
                        eq(agentTasks.priority, 0),
                        eq(agentTasks.agentId, 'JURIS'),
                        eq(agentTasks.agentId, 'DR-FORMULA')
                    )
                )
            );

        console.log(`Found ${criticalTasks.length} matching tasks for JURIS/DR-FORMULA.`);

        if (criticalTasks.length === 0) {
            console.log("No critical tasks found in `pending` state.");
            return;
        }

        for (const task of criticalTasks) {
            if (task.status === 'in_progress') {
                console.log(`[>>] FIXING STUCK TASK... resetting ${task.id} to pending.`);
                await db.execute(sql`
                    UPDATE agent_tasks SET status = 'pending', progress = 0
                    WHERE id = ${task.id}
                `);
            }
            console.log(`\n[>>] FORCING EXECUTION: [${task.agentId}] - "${task.title}" (Priority: ${task.priority})`);
            try {
                const result = await executeAgentTask(task.id);
                console.log(`[<<] RESULT: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
                if (result.outputUrl) {
                    console.log(`[++] Evidence: ${result.outputUrl}`);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[!!] EXECUTION CRASHED: ${message}`);
            }
        }

        console.log("\n=== EMERGENCY OVERRIDE COMPLETE ===");
        process.exit(0);
    } catch (error) {
        console.error("Fatal Script Error:", error);
        process.exit(1);
    }
}

forceExecutePriorityTasks();
