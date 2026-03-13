try { require("dotenv/config"); } catch (_) {}
import { Pool } from "pg";

async function checkSessions() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query("SELECT * FROM sessions ORDER BY expire DESC LIMIT 5");
    console.dir(result.rows, { depth: null });
  } catch (error) {
    console.error("Error fetching sessions:", error);
  } finally {
    await pool.end();
  }
}
checkSessions();
