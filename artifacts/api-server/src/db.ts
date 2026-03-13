import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

export const pool = new Pool({ connectionString });

pool.on("error", (err) => {
  console.error("[DB POOL ERROR]", err.message);
});

const SLOW_QUERY_THRESHOLD_MS = 1000;

export function instrumentedQuery(
  text: string,
  values?: unknown[]
): Promise<pg.QueryResult> {
  const start = Date.now();
  const truncated = text.length > 200 ? text.substring(0, 200) + "..." : text;
  return pool.query(text, values).then((result) => {
    const duration = Date.now() - start;
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[SLOW QUERY] ${duration}ms: ${truncated}`);
    }
    return result;
  }).catch((err: Error) => {
    const duration = Date.now() - start;
    console.error(`[QUERY ERROR] ${duration}ms: ${truncated} - ${err.message}`);
    throw err;
  });
}

export const db = drizzle(pool, { schema });
