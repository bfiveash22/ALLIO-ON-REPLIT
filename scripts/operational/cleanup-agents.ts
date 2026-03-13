import { db } from '../../ffpma-app/server/db';
import { agentRegistry } from '../../ffpma-app/shared/schema';
import { notLike } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function cleanupAgents() {
    console.log('Starting cleanup of duplicate agent registry entries...');

    // Find agents where agentId is lowercase
    const result = await db.delete(agentRegistry)
        .where(sql`${agentRegistry.agentId} != UPPER(${agentRegistry.agentId})`)
        .returning();

    console.log(`Deleted ${result.length} duplicate/lowercase agents.`);
    process.exit(0);
}

cleanupAgents().catch(err => {
    console.error(err);
    process.exit(1);
});
