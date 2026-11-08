import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/db/schema";

const {
  Pool,
} = pg;

const connectionString
  = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/app";

// Keep the pool small by default: a Raspberry Pi-class host runs Postgres, the gateway, and this
// API side by side. Raise DB_POOL_MAX on roomier hardware.
const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 5),
});

export const db = drizzle(pool, {
  schema,
});
