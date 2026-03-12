import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkEnums() {
    try {
        const res = await pool.query(`
      SELECT n.nspname AS enum_schema,
             t.typname AS enum_name,
             e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY enum_name, e.enumsortorder;
    `);

        const enums = {};
        for (const row of res.rows) {
            if (!enums[row.enum_name]) {
                enums[row.enum_name] = [];
            }
            enums[row.enum_name].push(row.enum_value);
        }

        console.log(JSON.stringify(enums, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkEnums();
