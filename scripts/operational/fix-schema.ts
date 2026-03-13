import { db } from '../../artifacts/api-server/src/db';
import { sql } from 'drizzle-orm';

async function fixSchema() {
    console.log('Adding retry_count to agent_tasks table...');
    try {
        await db.execute(sql`ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0`);
        console.log('Column added successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Failed to add column:', e);
        process.exit(1);
    }
}
fixSchema();
