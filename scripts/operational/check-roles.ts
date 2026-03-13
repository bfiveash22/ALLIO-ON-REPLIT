try { require("dotenv/config"); } catch (_) {}
import { db } from '../../ffpma-app/server/db';
import { users } from '../../ffpma-app/shared/schema';
import { ilike } from "drizzle-orm";

async function check() {
  const result = await db.select({ email: users.email, wpRoles: users.wpRoles }).from(users).where(ilike(users.email, "%blake%"));
  console.log("Blake users:", result);
  process.exit(0);
}
check().catch(console.error);
