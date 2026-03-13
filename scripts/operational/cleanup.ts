import { db } from '../../ffpma-app/server/db';
import { agentTasks } from '../../ffpma-app/shared/schema';
import { sql } from 'drizzle-orm';

async function run() {
  await db.delete(agentTasks).where(sql`description ILIKE '%CROSS-DIVISION SUPPORT REQUEST%'`);
  console.log('Cleaned db');
  process.exit(0);
}
run();
