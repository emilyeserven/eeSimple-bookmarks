import { eq } from "drizzle-orm";
import type { EntityLayout, EntityLayoutRecord, LayoutableEntityKind } from "@eesimple/types";
import { db } from "@/db";
import { entityLayouts } from "@/db/schema";

type EntityLayoutRow = typeof entityLayouts.$inferSelect;

function toRecord(row: EntityLayoutRow): EntityLayoutRecord {
  return {
    entityKind: row.entityKind as LayoutableEntityKind,
    layout: row.layout ?? null,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

/** List every stored entity-layout row. A kind absent from the result has no override. */
export async function listEntityLayouts(): Promise<EntityLayoutRecord[]> {
  const rows = await db.select().from(entityLayouts);
  return rows.map(toRecord);
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

/** Reset a kind to its default by deleting its stored row. Returns false when no row existed. */
export async function deleteEntityLayout(kind: LayoutableEntityKind): Promise<boolean> {
  const deleted = await db
    .delete(entityLayouts)
    .where(eq(entityLayouts.entityKind, kind))
    .returning({
      id: entityLayouts.id,
    });
  return deleted.length > 0;
}
