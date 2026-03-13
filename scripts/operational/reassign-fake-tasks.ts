import { db } from '../../ffpma-app/server/db';
import { agentTasks } from '../../ffpma-app/shared/schema';
import { eq, notInArray } from 'drizzle-orm';
import { agents } from '../../ffpma-app/shared/agents';

async function fixTasks() {
    const validIds = agents.map(a => a.id.toUpperCase());
    console.log('Valid agents:', validIds.length);

    const badTasks = await db.select().from(agentTasks).where(notInArray(agentTasks.agentId, validIds));
    console.log('Found tasks assigned to fake agents:', badTasks.length);

    for (const t of badTasks) {
        let newAgent = 'RESONANCE';
        if (t.division === 'financial') newAgent = 'ATLAS';
        if (t.division === 'support') newAgent = 'ALLIO-SUPPORT';
        if (t.division === 'marketing') newAgent = 'MUSE';
        if (t.division === 'engineering') newAgent = 'FORGE';
        if (t.division === 'legal') newAgent = 'JURIS';
        if (t.agentId === 'TERRAIN') newAgent = 'TERRA';
        if (t.agentId === 'DR_FORMULA') newAgent = 'DR-FORMULA';
        if (t.agentId === 'DR_TRIAGE') newAgent = 'DR-TRIAGE';
        if (t.agentId === 'TESLA') newAgent = 'RESONANCE';
        if (t.agentId === 'TITAN') newAgent = 'ATLAS';
        if (t.agentId === 'legal-lead') newAgent = 'JURIS';
        if (t.agentId === 'sentinel') newAgent = 'SENTINEL';
        if (t.agentId === 'CHIRO') newAgent = 'CHIRO';
        if (t.agentId === 'ANTIGRAVITY') newAgent = 'SENTINEL'; // Antigravity tasks roll up to Sentinel

        console.log(`Reassigning task ${t.id} from ${t.agentId} to ${newAgent}`);
        await db.update(agentTasks).set({ agentId: newAgent }).where(eq(agentTasks.id, t.id));
    }
    console.log('Task reassignment complete.');
    process.exit(0);
}

fixTasks().catch(err => {
    console.error(err);
    process.exit(1);
});
