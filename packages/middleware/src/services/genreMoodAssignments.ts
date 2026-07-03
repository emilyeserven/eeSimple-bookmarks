import { and, asc, eq } from "drizzle-orm";
import type { BookmarkGenreMood, GenreMoodOwnerType } from "@eesimple/types";
import { db } from "@/db";
import { genreMoodAssignments, genreMoods } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
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
