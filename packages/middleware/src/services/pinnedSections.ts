import type { CreatePinnedSectionInput, PinnedSection, UpdatePinnedSectionInput } from "@eesimple/types";
import type { PinnedSectionRow } from "@/db/schema";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { pinnedSections } from "@/db/schema";

function toPinnedSection(row: PinnedSectionRow): PinnedSection {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listPinnedSections(): Promise<PinnedSection[]> {
  const rows = await db
    .select()
    .from(pinnedSections)
    .orderBy(asc(pinnedSections.sortOrder), asc(pinnedSections.createdAt));
  return rows.map(toPinnedSection);
}

/** Create a new pinned section. sortOrder defaults to one more than the current max. */
export async function createPinnedSection(
  input: CreatePinnedSectionInput,
): Promise<PinnedSection> {
  const [{
    max,
  }] = await db
    .select({
      max: sql<number>`COALESCE(MAX(${pinnedSections.sortOrder}), -1)`,
    })
    .from(pinnedSections);
  const [row] = await db
    .insert(pinnedSections)
    .values({
      name: input.name,
      sortOrder: (max ?? -1) + 1,
    })
    .returning();
  return toPinnedSection(row);
}

export async function updatePinnedSection(
  id: string,
  input: UpdatePinnedSectionInput,
): Promise<PinnedSection | null> {
  const patch: Partial<Pick<PinnedSectionRow, "name" | "sortOrder">> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) {
    const [existing] = await db.select().from(pinnedSections).where(eq(pinnedSections.id, id));
    return existing ? toPinnedSection(existing) : null;
  }
  const [row] = await db
    .update(pinnedSections)
    .set(patch)
    .where(eq(pinnedSections.id, id))
    .returning();
  return row ? toPinnedSection(row) : null;
}

/** Delete a section. The `section_id` FK is `ON DELETE SET NULL`, so its pins fall back to ungrouped. */
export async function deletePinnedSection(id: string): Promise<boolean> {
  const result = await db
    .delete(pinnedSections)
    .where(eq(pinnedSections.id, id))
    .returning({
      id: pinnedSections.id,
    });
  return result.length > 0;
}

export async function reorderPinnedSections(orderedIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(pinnedSections)
        .set({
          sortOrder: i,
        })
        .where(eq(pinnedSections.id, orderedIds[i]));
    }
  });
}
