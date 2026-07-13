import type {
  CreatePinnedSidebarItemInput,
  PinnedSidebarItem,
  UpdatePinnedSidebarItemInput,
} from "@eesimple/types";
import type { PinnedSidebarItemRow } from "@/db/schema";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { pinnedSidebarItems } from "@/db/schema";

function toPinnedSidebarItem(row: PinnedSidebarItemRow): PinnedSidebarItem {
  return {
    id: row.id,
    entityType: row.entityType as PinnedSidebarItem["entityType"],
    entityId: row.entityId,
    sectionId: row.sectionId,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listPinnedSidebarItems(): Promise<PinnedSidebarItem[]> {
  const rows = await db
    .select()
    .from(pinnedSidebarItems)
    .orderBy(asc(pinnedSidebarItems.sortOrder), asc(pinnedSidebarItems.createdAt));
  return rows.map(toPinnedSidebarItem);
}

export async function createPinnedSidebarItem(
  input: CreatePinnedSidebarItemInput,
): Promise<PinnedSidebarItem> {
  const [row] = await db
    .insert(pinnedSidebarItems)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      sectionId: input.sectionId ?? null,
    })
    .returning();
  return toPinnedSidebarItem(row);
}

/** Reassign a pin's section and/or its sortOrder. */
export async function updatePinnedSidebarItem(
  id: string,
  input: UpdatePinnedSidebarItemInput,
): Promise<PinnedSidebarItem | null> {
  const patch: Partial<Pick<PinnedSidebarItemRow, "sectionId" | "sortOrder">> = {};
  if (input.sectionId !== undefined) patch.sectionId = input.sectionId;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) {
    const [existing] = await db
      .select()
      .from(pinnedSidebarItems)
      .where(eq(pinnedSidebarItems.id, id));
    return existing ? toPinnedSidebarItem(existing) : null;
  }
  const [row] = await db
    .update(pinnedSidebarItems)
    .set(patch)
    .where(eq(pinnedSidebarItems.id, id))
    .returning();
  return row ? toPinnedSidebarItem(row) : null;
}

export async function reorderPinnedSidebarItems(orderedIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(pinnedSidebarItems)
        .set({
          sortOrder: i,
        })
        .where(eq(pinnedSidebarItems.id, orderedIds[i]));
    }
  });
}

export async function deletePinnedSidebarItem(id: string): Promise<boolean> {
  const result = await db
    .delete(pinnedSidebarItems)
    .where(eq(pinnedSidebarItems.id, id))
    .returning({
      id: pinnedSidebarItems.id,
    });
  return result.length > 0;
}
