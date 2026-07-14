import { eq, inArray } from "drizzle-orm";
import type {
  BulkBookmarkResult,
  BulkBookmarkTagOp,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  UpdateBookmarkInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { cleanupBookmarkEntityNames, cleanupGenreMoodAssignments } from "@/services/bookmarkCleanup";
import { DuplicateUrlError } from "@/services/bookmarkErrors";
import { hasValuePatch, mergeBookmarkValues } from "@/services/bookmarkValueMerge";
import { getBookmark, updateBookmark } from "@/services/bookmarkCrud";

/**
 * Apply a batch of URL rewrites (e.g. expanding shortened links). Each item reuses `updateBookmark`
 * so the website / YouTube-channel are re-derived, and preserves the pre-existing original URL (or
 * records the old URL as the original on first change). Per-item failures are reported rather than
 * aborting the batch, so one duplicate doesn't sink the rest.
 */
export async function bulkUpdateBookmarkUrls(items: BulkUrlUpdate[]): Promise<BulkUrlUpdateResult[]> {
  const results: BulkUrlUpdateResult[] = [];
  for (const item of items) {
    const [current] = await db
      .select({
        url: bookmarks.url,
        originalUrl: bookmarks.originalUrl,
      })
      .from(bookmarks)
      .where(eq(bookmarks.id, item.id));
    if (!current) {
      results.push({
        id: item.id,
        status: "not-found",
      });
      continue;
    }
    if (current.url === item.url) {
      results.push({
        id: item.id,
        status: "skipped-unchanged",
      });
      continue;
    }
    try {
      await updateBookmark(item.id, {
        url: item.url,
        // Keep the first-seen original; otherwise record the URL we're replacing.
        originalUrl: current.originalUrl ?? current.url,
      });
      results.push({
        id: item.id,
        status: "applied",
      });
    }
    catch (err) {
      if (err instanceof DuplicateUrlError) {
        results.push({
          id: item.id,
          status: "skipped-duplicate",
          message: err.message,
        });
      }
      else {
        results.push({
          id: item.id,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  return results;
}

/**
 * Delete many bookmarks in one statement, reporting per-item outcomes. Ids that didn't exist are
 * marked `not-found`; everything that was removed is `deleted`. The cache is invalidated once.
 */
export async function bulkDeleteBookmarks(ids: string[]): Promise<BulkBookmarkResult[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .delete(bookmarks)
    .where(inArray(bookmarks.id, ids))
    .returning({
      id: bookmarks.id,
    });
  const deleted = new Set(rows.map(row => row.id));
  await cleanupGenreMoodAssignments([...deleted]);
  await cleanupBookmarkEntityNames([...deleted]);
  if (deleted.size > 0) invalidateBookmarkCache();
  return ids.map(id => ({
    id,
    status: deleted.has(id) ? "deleted" : "not-found",
  }));
}

/**
 * Apply the same partial patch to many bookmarks, reporting per-item outcomes. Each item reuses
 * `updateBookmark` so website / channel re-derivation and calculate recompute stay correct. When the
 * patch sets custom-property values, they are *merged* into each bookmark's existing values (see
 * {@link mergeBookmarkValues}) so untouched properties of the same kind aren't wiped.
 */
export async function bulkUpdateBookmarks(
  ids: string[],
  patch: UpdateBookmarkInput,
): Promise<BulkBookmarkResult[]> {
  const results: BulkBookmarkResult[] = [];
  const mergesValues = hasValuePatch(patch);
  for (const id of ids) {
    try {
      let effective = patch;
      if (mergesValues) {
        const existing = await getBookmark(id);
        if (!existing) {
          results.push({
            id,
            status: "not-found",
          });
          continue;
        }
        effective = {
          ...patch,
          ...mergeBookmarkValues(existing, patch),
        };
      }
      const updated = await updateBookmark(id, effective);
      results.push(
        updated
          ? {
            id,
            status: "applied",
          }
          : {
            id,
            status: "not-found",
          },
      );
    }
    catch (err) {
      results.push({
        id,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/**
 * Add or remove a fixed set of tags across many bookmarks, reporting per-item outcomes. Tags are
 * unioned (add) or differenced (remove) against each bookmark's current tags, then persisted via
 * `updateBookmark` so the resulting set replaces the old one.
 */
export async function bulkUpdateBookmarkTags(
  ids: string[],
  tagIds: string[],
  op: BulkBookmarkTagOp,
): Promise<BulkBookmarkResult[]> {
  const results: BulkBookmarkResult[] = [];
  const removeSet = new Set(tagIds);
  for (const id of ids) {
    try {
      const existing = await getBookmark(id);
      if (!existing) {
        results.push({
          id,
          status: "not-found",
        });
        continue;
      }
      const current = existing.tags.map(tag => tag.id);
      const next = op === "add"
        ? [...new Set([...current, ...tagIds])]
        : current.filter(tagId => !removeSet.has(tagId));
      await updateBookmark(id, {
        tagIds: next,
      });
      results.push({
        id,
        status: "applied",
      });
    }
    catch (err) {
      results.push({
        id,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
