import { count, isNull } from "drizzle-orm";
import type { OrphanDeleteResult } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { cleanupBookmarkEntityNames, cleanupGenreMoodAssignments } from "@/services/bookmarkCleanup";

/** Count bookmarks with no category (`categoryId IS NULL`). */
export async function countOrphanedBookmarks(): Promise<number> {
  const [row] = await db
    .select({
      value: count(),
    })
    .from(bookmarks)
    .where(isNull(bookmarks.categoryId));
  return row?.value ?? 0;
}

/** Delete every bookmark with no category. Returns the number of rows deleted. */
export async function deleteOrphanedBookmarks(): Promise<OrphanDeleteResult> {
  const rows = await db
    .delete(bookmarks)
    .where(isNull(bookmarks.categoryId))
    .returning({
      id: bookmarks.id,
    });
  if (rows.length > 0) {
    await cleanupGenreMoodAssignments(rows.map(row => row.id));
    await cleanupBookmarkEntityNames(rows.map(row => row.id));
    invalidateBookmarkCache();
  }
  return {
    deleted: rows.length,
  };
}
