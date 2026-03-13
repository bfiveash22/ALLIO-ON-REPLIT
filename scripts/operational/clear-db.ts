import { Pool } from 'pg';
try { require("dotenv").config(); } catch (_) {}

async function clearDB() {
  if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Dropping tables to resolve schema conflicts...');
    await pool.query(`DROP TABLE IF EXISTS messages CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS conversations CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS tasks CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS "agentTasks" CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS agent_tasks CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);
    console.log('Successfully dropped tables.');
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await pool.end();
  }
}

clearDB();
