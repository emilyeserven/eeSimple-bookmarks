import { eq } from "drizzle-orm";
import type { EntityLayout, EntityLayoutRecord, LayoutableEntityKind, LayoutStorageKind } from "@eesimple/types";
import { explainEntityLayoutIssues } from "@eesimple/types";
import { db } from "@/db";
import { entityLayouts } from "@/db/schema";

type EntityLayoutRow = typeof entityLayouts.$inferSelect;

/**
 * Map a DB row to the API envelope. A structurally-invalid stored `layout` (e.g. malformed/
 * pre-validation legacy data) is NOT trusted: `layout` is nulled so the client's `resolveLayout`
 * falls back to the code default, and the raw value + specific reasons ride `rawLayout`/`issues` so
 * the corruption is surfaced (Settings → Advanced → Layout Issues) rather than silently healed.
 */
function toRecord(row: EntityLayoutRow): EntityLayoutRecord {
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt);
  const issues = row.layout == null ? [] : explainEntityLayoutIssues(row.layout);
  if (issues.length > 0) {
    return {
      entityKind: row.entityKind as LayoutStorageKind,
      layout: null,
      updatedAt,
      invalid: true,
      rawLayout: row.layout,
      issues,
    };
  }
  return {
    entityKind: row.entityKind as LayoutStorageKind,
    layout: row.layout ?? null,
    updatedAt,
  };
}

/** List every stored entity-layout row. A kind absent from the result has no override. */
export async function listEntityLayouts(): Promise<EntityLayoutRecord[]> {
  const rows = await db.select().from(entityLayouts);
  return rows.map(toRecord);
}

/**
 * The kinds whose stored layout fails structural validation, with the specific reasons. Read-only;
 * used by the boot integrity step (`index.ts`) to log corruption loudly rather than heal it silently.
 */
export async function findInvalidEntityLayouts(): Promise<{ kind: string;
  issues: string[]; }[]> {
  const rows = await db.select().from(entityLayouts);
  const invalid: { kind: string;
    issues: string[]; }[] = [];
  for (const row of rows) {
    if (row.layout == null) continue;
    const issues = explainEntityLayoutIssues(row.layout);
    if (issues.length > 0) invalid.push({
      kind: row.entityKind,
      issues,
    });
  }
  return invalid;
}

/**
 * Store (or replace) the layout for one entity kind. Select-then-branch rather than a DB-level
 * `onConflictDoUpdate` — keeps this testable against the shared in-memory fake db, and mirrors how
 * `ensureDefaultCardDisplayRule` also does count-then-insert rather than a DB-level upsert.
 */
export async function upsertEntityLayout(
  kind: LayoutableEntityKind,
  layout: EntityLayout,
): Promise<EntityLayoutRecord> {
  const [existing] = await db.select().from(entityLayouts).where(eq(entityLayouts.entityKind, kind));
  if (existing) {
    const [row] = await db
      .update(entityLayouts)
      .set({
        layout,
        updatedAt: new Date(),
      })
      .where(eq(entityLayouts.entityKind, kind))
      .returning();
    return toRecord(row);
  }

  const [row] = await db
    .insert(entityLayouts)
    .values({
      entityKind: kind,
      layout,
      updatedAt: new Date(),
    })
    .returning();
  return toRecord(row);
}

/**
 * Reset a kind to its default by deleting its stored row. Returns false when no row existed.
 * Typed to {@link LayoutStorageKind} (a widened string) so a corrupted non-enum `taxonomy:<id>`-keyed
 * row can also be cleared — the SQL is a plain string equality on `entity_kind`.
 */
export async function deleteEntityLayout(kind: LayoutStorageKind): Promise<boolean> {
  const deleted = await db
    .delete(entityLayouts)
    .where(eq(entityLayouts.entityKind, kind))
    .returning({
      id: entityLayouts.id,
    });
  return deleted.length > 0;
}
