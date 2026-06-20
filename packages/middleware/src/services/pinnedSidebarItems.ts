import type { CreatePinnedSidebarItemInput, PinnedSidebarItem } from "@eesimple/types";
import type { PinnedSidebarItemRow } from "@/db/schema";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { pinnedSidebarItems } from "@/db/schema";

function toPinnedSidebarItem(row: PinnedSidebarItemRow): PinnedSidebarItem {
  return {
    id: row.id,
    entityType: row.entityType as PinnedSidebarItem["entityType"],
    entityId: row.entityId,
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
    })
    .returning();
  return toPinnedSidebarItem(row);
}

export async function deletePinnedSidebarItem(id: string): Promise<boolean> {
  const result = await db
    .delete(pinnedSidebarItems)
    .where(eq(pinnedSidebarItems.id, id))
    .returning({ id: pinnedSidebarItems.id });
  return result.length > 0;
}
