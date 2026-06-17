/**
 * Runtime database migrations. Applies the versioned SQL in `../../drizzle` using Drizzle's
 * node-postgres migrator, then exits. This is the authoritative, deterministic way the schema is
 * brought up to date in production — `drizzle-kit push` (run afterward by the gateway) only
 * reconciles any residual drift. Run via `migrate:prod` (compiled) or `migrate:dev` (tsx).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const {
  Pool,
} = pg;

const connectionString
  = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/bookmarks";

// dist/db/migrate.js and src/db/migrate.ts both sit two levels below the package root.
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "drizzle");

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString,
  });
  const db = drizzle(pool);
  try {
    console.log(`[migrate] applying migrations from ${migrationsFolder}…`);
    await migrate(db, {
      migrationsFolder,
    });
    console.log("[migrate] migrations up to date");
  }
  finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
