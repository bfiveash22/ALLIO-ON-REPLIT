try { require("dotenv/config"); } catch (_) {}
import { db } from '../../artifacts/api-server/src/db';
import { users } from '../../lib/shared/src/schema';
import { ilike } from "drizzle-orm";

async function check() {
  const result = await db.select({ email: users.email, wpRoles: users.wpRoles }).from(users).where(ilike(users.email, "%blake%"));
  console.log("Blake users:", result);
  process.exit(0);
}
check().catch(console.error);
