import { db } from '../../artifacts/api-server/src/db';
import { agentTasks } from '../../lib/shared/src/schema';
import { sql } from 'drizzle-orm';

async function run() {
  await db.delete(agentTasks).where(sql`description ILIKE '%CROSS-DIVISION SUPPORT REQUEST%'`);
  console.log('Cleaned db');
  process.exit(0);
}
run();
