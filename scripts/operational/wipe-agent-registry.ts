import { db } from '../../artifacts/api-server/src/db';
import { agentRegistry } from '../../lib/shared/src/schema';
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
