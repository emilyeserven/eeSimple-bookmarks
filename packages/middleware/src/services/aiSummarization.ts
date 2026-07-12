import type { AiSummaryApplyInput, AiSummaryApplyResult, AiSummaryQueueItem, UpdateBookmarkInput } from "@eesimple/types";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkChoicesValues, bookmarks, bookmarkTags, customProperties } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { updateBookmark } from "@/services/bookmarks";
import { CONTENT_STATUS_SLUG } from "@/services/customProperties";
import { resolveTagIdsByName } from "@/services/tags";

const SUMMARIZED_BY_AI_VALUE = "summarized-by-ai";

/** Return the id, url, and title of all bookmarks whose Content Status is "AI Summary Queue". */
export async function getAiSummaryQueueBookmarks(): Promise<AiSummaryQueueItem[]> {
  const [prop] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));
  if (!prop) return [];

  return db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .innerJoin(
      bookmarkChoicesValues,
      and(
        eq(bookmarkChoicesValues.bookmarkId, bookmarks.id),
        eq(bookmarkChoicesValues.propertyId, prop.id),
        sql`${bookmarkChoicesValues.values} @> '["ai-summary-queue"]'::jsonb`,
      ),
    )
    .orderBy(bookmarks.title);
}

/**
 * Transition all bookmarks with Content Status "AI Summary Queue" to "Summarized by AI".
 * Returns the number of bookmarks updated.
 */
export async function markAiQueueSummarized(): Promise<{ count: number }> {
  const [prop] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));
  if (!prop) return {
    count: 0,
  };

  const result = await db
    .update(bookmarkChoicesValues)
    .set({
      values: sql`'["summarized-by-ai"]'::jsonb`,
    })
    .where(
      sql`${bookmarkChoicesValues.propertyId} = ${prop.id}::uuid
        AND ${bookmarkChoicesValues.values} @> '["ai-summary-queue"]'::jsonb`,
    );

  const count = result.rowCount ?? 0;
  if (count > 0) invalidateBookmarkCache();
  return {
    count,
  };
}

/**
 * Apply a batch of AI-returned summaries to their bookmarks: overwrite each bookmark's description
 * with its summary, mark it "Summarized by AI", and (when tags are supplied) union the suggested
 * tags — matched by name, creating any that don't exist — onto the bookmark's existing tags.
 * Ids that match no bookmark are collected in `notFound` rather than failing the whole batch.
 */
export async function applyAiSummaries(input: AiSummaryApplyInput): Promise<AiSummaryApplyResult> {
  const result: AiSummaryApplyResult = {
    updated: 0,
    notFound: [],
    tagsCreated: 0,
  };
  if (input.items.length === 0) return result;

  // Resolve the Content Status property once so each applied bookmark can be marked "Summarized by AI".
  const [prop] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));

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

    // Description: overwrite with the AI summary. Tags: union suggested onto existing (never remove).
    const patch: UpdateBookmarkInput = {
      description: item.summary,
    };
    if (item.tags && item.tags.length > 0) {
      const suggestedIds = await resolveTagIdsByName(item.tags, tagsCreated);
      const current = await db
        .select({
          tagId: bookmarkTags.tagId,
        })
        .from(bookmarkTags)
        .where(eq(bookmarkTags.bookmarkId, item.id));
      patch.tagIds = [...new Set([...current.map(row => row.tagId), ...suggestedIds])];
    }
    await updateBookmark(item.id, patch);

    // Mark "Summarized by AI" by upserting only the Content Status row — leaves other choices values intact.
    if (prop) {
      await db
        .insert(bookmarkChoicesValues)
        .values({
          bookmarkId: item.id,
          propertyId: prop.id,
          values: [SUMMARIZED_BY_AI_VALUE],
        })
        .onConflictDoUpdate({
          target: [bookmarkChoicesValues.bookmarkId, bookmarkChoicesValues.propertyId],
          set: {
            values: [SUMMARIZED_BY_AI_VALUE],
          },
        });
    }

    result.updated += 1;
    changed = true;
  }

  result.tagsCreated = tagsCreated.count;
  // Descriptions, tags, and content status are all matchable — refresh once after the content-status writes.
  if (changed) invalidateBookmarkCache();
  return result;
}
