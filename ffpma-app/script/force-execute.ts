import { db } from '../server/db';
import { agentTasks } from '../shared/schema';
import { eq, or, and } from 'drizzle-orm';
import { executeAgentTask } from '../server/services/agent-executor';

async function forceExecutePriorityTasks() {
    console.log("=== EMERGENCY OVERRIDE: INITIATING PRIORITY 0 TASK EXECUTION ===");

    try {
        // 1. Fetch Priority 0 Tasks (or Priority 1 if they were mislabeled before the fix)
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

        // 2. Iterate and Execute Immediately
        for (const task of criticalTasks) {
            if (task.status === 'in_progress') {
                console.log(`[>>] FIXING STUCK TASK... resetting ${task.id} to pending.`);
                await db.update(agentTasks).set({ status: 'pending', progress: 0 }).where(eq(agentTasks.id, task.id));
            }
            console.log(`\\n[>>] FORCING EXECUTION: [${task.agentId}] - "${task.title}" (Priority: ${task.priority})`);
            try {
                const result = await executeAgentTask(task.id);
                console.log(`[<<] RESULT: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
                if (result.outputUrl) {
                    console.log(`[++] Evidence: ${result.outputUrl}`);
                }
            } catch (err: any) {
                console.error(`[!!] EXECUTION CRASHED: ${err.message}`);
            }
        }

        console.log("\\n=== EMERGENCY OVERRIDE COMPLETE ===");
        process.exit(0);
    } catch (error) {
        console.error("Fatal Script Error:", error);
        process.exit(1);
    }
}

forceExecutePriorityTasks();
