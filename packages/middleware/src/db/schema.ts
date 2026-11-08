/**
 * Drizzle schema — the single source of truth for the database.
 *
 * `drizzle-kit push` diffs this file against the live database on every boot and applies the
 * additive delta. Read the `db-schema-change` skill before editing: a NEW table, a NOT NULL column,
 * or a unique constraint on a populated table needs an idempotent pre-step in `migrate.ts` or the
 * non-interactive production push will silently skip it.
 */
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Example entity — rename or replace it when you start a real project. */
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});
