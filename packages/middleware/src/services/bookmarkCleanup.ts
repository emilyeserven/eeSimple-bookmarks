import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { entityNames, taxonomyAssignments } from "@/db/schema";

/**
 * Remove the polymorphic Genres & Moods assignment rows for deleted bookmark ids. `ownerId` carries
 * no cascade FK, so every bookmark-delete path must call this to keep counts accurate.
 */
export async function cleanupGenreMoodAssignments(bookmarkIds: string[]): Promise<void> {
  if (bookmarkIds.length === 0) return;
  // Genres & Moods was folded into the generic taxonomy layer, so a bookmark's G&M rows live in
  // `taxonomy_assignments` — this one delete covers every taxonomy (including G&M) for these owners.
  await db.delete(taxonomyAssignments).where(and(
    eq(taxonomyAssignments.ownerType, "bookmark"),
    inArray(taxonomyAssignments.ownerId, bookmarkIds),
  ));
}

/**
 * Remove the polymorphic multilingual-name rows for deleted bookmark ids. `ownerId` carries no
 * cascade FK (like the genre/mood assignments above), so every bookmark-delete path must call this.
 */
export async function cleanupBookmarkEntityNames(bookmarkIds: string[]): Promise<void> {
  if (bookmarkIds.length === 0) return;
  await db.delete(entityNames).where(and(
    eq(entityNames.ownerType, "bookmark"),
    inArray(entityNames.ownerId, bookmarkIds),
  ));
}
