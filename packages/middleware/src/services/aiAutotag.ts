import type { AiAutotagApplyInput, AiAutotagApplyResult, AiUntaggedBookmark, UpdateBookmarkInput } from "@eesimple/types";
import { desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookmarks, bookmarkTags } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { updateBookmark } from "@/services/bookmarks";
import { resolveTagIdsByName } from "@/services/tags";

/**
 * Return the id, url, and title of the most recently created bookmarks that carry no tags — the batch
 * offered to the AI Autotag prompt. A left join to `bookmark_tags` with a null-on-the-join filter is a
 * simple anti-join; each untagged bookmark yields exactly one null-side row.
 */
export async function getUntaggedBookmarks(limit: number): Promise<AiUntaggedBookmark[]> {
  return db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .leftJoin(bookmarkTags, eq(bookmarkTags.bookmarkId, bookmarks.id))
    .where(isNull(bookmarkTags.bookmarkId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit);
}

/**
 * Apply a batch of AI-returned tags to their bookmarks: for each item, resolve the suggested tag names —
 * matched by name, creating any that don't exist — and union them onto the bookmark's existing tags
 * (never removing). Ids that match no bookmark are collected in `notFound` rather than failing the batch.
 */
export async function applyAiTags(input: AiAutotagApplyInput): Promise<AiAutotagApplyResult> {
  const result: AiAutotagApplyResult = {
    updated: 0,
    notFound: [],
    tagsCreated: 0,
  };
  if (input.items.length === 0) return result;

  // Validate all referenced ids in one query.
  const ids = [...new Set(input.items.map(item => item.id))];
  const existingRows = await db
    .select({
      id: bookmarks.id,
    })
    .from(bookmarks)
    .where(inArray(bookmarks.id, ids));
  const existingIds = new Set(existingRows.map(row => row.id));

  const tagsCreated = {
    count: 0,
  };
  let changed = false;

  for (const item of input.items) {
    if (!existingIds.has(item.id)) {
      result.notFound.push(item.id);
      continue;
    }
    if (item.tags.length === 0) continue;

    const suggestedIds = await resolveTagIdsByName(item.tags, tagsCreated);
    if (suggestedIds.length === 0) continue;

    const current = await db
      .select({
        tagId: bookmarkTags.tagId,
      })
      .from(bookmarkTags)
      .where(eq(bookmarkTags.bookmarkId, item.id));
    const patch: UpdateBookmarkInput = {
      tagIds: [...new Set([...current.map(row => row.tagId), ...suggestedIds])],
    };
    await updateBookmark(item.id, patch);

    result.updated += 1;
    changed = true;
  }

  result.tagsCreated = tagsCreated.count;
  // Tags are matchable — refresh once after the batch (updateBookmark also invalidates per write).
  if (changed) invalidateBookmarkCache();
  return result;
}
