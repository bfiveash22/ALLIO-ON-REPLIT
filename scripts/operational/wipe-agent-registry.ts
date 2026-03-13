import { db } from '../../ffpma-app/server/db';
import { agentRegistry } from '../../ffpma-app/shared/schema';
import { sql } from 'drizzle-orm';

async function wipe() {
    console.log('Wiping agent_registry table to resolve 47 vs 48 ghost issue...');
    await db.execute(sql`DELETE FROM agent_registry`);
    console.log('Wipe complete.');
    process.exit(0);
}

wipe().catch(err => {
    console.error(err);
    process.exit(1);
});
