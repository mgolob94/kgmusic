/**
 * Zažene migracije in ustvari račun učiteljice (ADMIN_EMAIL / ADMIN_PASSWORD), če še ne obstaja.
 * V Dockerju se skripta zbundla v dist/migrate.cjs in zažene pred strežnikom.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import postgres from "postgres";
import { users } from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ni nastavljen");

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  const folder = process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
  console.log(`[migrate] migracije iz ${folder}`);
  await migrate(db, { migrationsFolder: folder });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length === 0) {
      await db.insert(users).values({ email, passwordHash: await bcrypt.hash(password, 12) });
      console.log(`[migrate] ustvarjen uporabnik ${email}`);
    }
  } else {
    console.log("[migrate] ADMIN_EMAIL/ADMIN_PASSWORD nista nastavljena – uporabnika ne ustvarjam");
  }

  await sql.end();
  console.log("[migrate] končano");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
