import { and, asc, eq } from "drizzle-orm";
import type { BookmarkGenreMood, GenreMoodOwnerType } from "@eesimple/types";
import { db } from "@/db";
import { genreMoodAssignments, genreMoods } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCacheVersion";
import { slugify } from "@/utils/slug";

/** The Genres & Moods entries attached to a single owner (bookmark or taxonomy entity). */
export async function getOwnerGenreMoods(
  ownerType: GenreMoodOwnerType,
  ownerId: string,
): Promise<BookmarkGenreMood[]> {
  const rows = await db
    .select({
      id: genreMoods.id,
      name: genreMoods.name,
      slug: genreMoods.slug,
      parentId: genreMoods.parentId,
    })
    .from(genreMoodAssignments)
    .innerJoin(genreMoods, eq(genreMoodAssignments.genreMoodId, genreMoods.id))
    .where(and(
      eq(genreMoodAssignments.ownerType, ownerType),
      eq(genreMoodAssignments.ownerId, ownerId),
    ))
    .orderBy(asc(genreMoods.name));
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    parentId: row.parentId,
  }));
}

/**
 * The Genres & Moods ids attached to every owner of one `ownerType`, grouped by `ownerId`. Powers
 * the bookmark-listing "Media" tab's independent-match check (see `mediaItemsForBookmarks.ts`)
 * without an N+1 per media item.
 */
export async function listGenreMoodIdsByOwnerType(
  ownerType: GenreMoodOwnerType,
): Promise<Record<string, string[]>> {
  const rows = await db
    .select({
      ownerId: genreMoodAssignments.ownerId,
      genreMoodId: genreMoodAssignments.genreMoodId,
    })
    .from(genreMoodAssignments)
    .where(eq(genreMoodAssignments.ownerType, ownerType));
  const byOwner: Record<string, string[]> = {};
  for (const row of rows) {
    (byOwner[row.ownerId] ??= []).push(row.genreMoodId);
  }
  return byOwner;
}

/**
 * Replace the full set of Genres & Moods entries attached to one owner (delete-then-insert for that
 * owner only). Bookmark owners refresh the bookmark cache since the attachment is matchable data.
 */
export async function setOwnerGenreMoods(
  ownerType: GenreMoodOwnerType,
  ownerId: string,
  genreMoodIds: string[],
): Promise<BookmarkGenreMood[]> {
  const unique = [...new Set(genreMoodIds)];
  await db.transaction(async (tx) => {
    await tx.delete(genreMoodAssignments).where(and(
      eq(genreMoodAssignments.ownerType, ownerType),
      eq(genreMoodAssignments.ownerId, ownerId),
    ));
    if (unique.length > 0) {
      await tx.insert(genreMoodAssignments).values(unique.map(genreMoodId => ({
        genreMoodId,
        ownerType,
        ownerId,
      })));
    }
  });
  if (ownerType === "bookmark") invalidateBookmarkCache();
  return getOwnerGenreMoods(ownerType, ownerId);
}

/**
 * Remove every Genres & Moods attachment for one owner. Called from each owner entity's delete
 * service (bookmark + all taxonomies) since `ownerId` carries no cascade FK.
 */
export async function deleteGenreMoodAssignmentsForOwner(
  ownerType: GenreMoodOwnerType,
  ownerId: string,
): Promise<void> {
  await db.delete(genreMoodAssignments).where(and(
    eq(genreMoodAssignments.ownerType, ownerType),
    eq(genreMoodAssignments.ownerId, ownerId),
  ));
  if (ownerType === "bookmark") invalidateBookmarkCache();
}
