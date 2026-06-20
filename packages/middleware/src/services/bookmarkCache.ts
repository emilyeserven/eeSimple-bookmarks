import { inArray } from "drizzle-orm";
import type { ConditionInput, TagDescendants } from "@eesimple/types";
import { buildTagDescendants } from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkNumberValues,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  tags,
} from "@/db/schema";
import { ensureDefaultCategory } from "@/services/categories";

/**
 * In-memory cache of everything needed to evaluate a condition tree against every bookmark in one
 * pass: the base bookmark rows, their per-bookmark {@link ConditionInput}s, and a tag-descendant
 * resolver. This is the "load once, evaluate the shared predicate in-memory" pattern shared by the
 * homepage-section matcher and the autofill preview — see CLAUDE.md → "Data shaping".
 *
 * The middleware runs as a single process (the gateway spawns one child), so this cache is
 * coherent. It is invalidated by version bump, not eviction: every write that changes a bookmark's
 * *matchable* data (the bookmark row, its tags, or its custom-property values) — or the tag tree
 * that drives descendant resolution — must call {@link invalidateBookmarkCache}. The data is only
 * consumed by eventually-consistent surfaces, so a brief staleness window during a rebuild is fine.
 */
export interface BookmarkEvaluationData {
  /** All bookmark rows, loaded once. */
  baseRows: BookmarkRow[];
  /** Per-bookmark condition inputs keyed by bookmark id, for `evaluateConditions`. */
  conditionInputs: Map<string, ConditionInput>;
  /** Tag descendant resolver for tag conditions. */
  tagDescendants: TagDescendants;
}

let version = 0;
let snapshot: { version: number;
  data: BookmarkEvaluationData; } | null = null;

/**
 * Mark the cached bookmark evaluation data stale so the next {@link getBookmarkEvaluationData} call
 * rebuilds it. Cheap (a counter bump) — the rebuild is deferred to the next read.
 */
export function invalidateBookmarkCache(): void {
  version += 1;
}

/**
 * Return the (cached) {@link BookmarkEvaluationData}, rebuilding it whenever the cached snapshot
 * predates the current version. A concurrent invalidation during a rebuild simply forces the next
 * caller to rebuild again, so callers never observe data older than the moment they called.
 */
export async function getBookmarkEvaluationData(): Promise<BookmarkEvaluationData> {
  if (snapshot && snapshot.version === version) return snapshot.data;
  const target = version;
  const data = await loadEvaluationData();
  // Publish only if no invalidation landed mid-load; otherwise leave the snapshot stale so the
  // next call rebuilds with the newer data.
  if (target === version) {
    snapshot = {
      version: target,
      data,
    };
  }
  return data;
}

async function loadEvaluationData(): Promise<BookmarkEvaluationData> {
  const defaultCategoryId = await ensureDefaultCategory();

  // Only id/parentId are needed for descendant resolution — avoid the expensive count query in
  // `listTags` (and the circular import it would create).
  const tagRows = await db
    .select({
      id: tags.id,
      parentId: tags.parentId,
    })
    .from(tags);
  const tagDescendants = buildTagDescendants(tagRows);

  const baseRows = await db.select().from(bookmarks);
  const conditionInputs = await buildConditionInputs(baseRows, defaultCategoryId);
  return {
    baseRows,
    conditionInputs,
    tagDescendants,
  };
}

/** Load per-bookmark condition inputs for in-memory filter evaluation, batched to avoid N+1. */
async function buildConditionInputs(
  baseRows: BookmarkRow[],
  defaultCategoryId: string,
): Promise<Map<string, ConditionInput>> {
  const ids = baseRows.map(row => row.id);
  if (ids.length === 0) return new Map();

  const [tagRows, numberRows, booleanRows, dateTimeRows] = await Promise.all([
    db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        tagId: bookmarkTags.tagId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkNumberValues.bookmarkId,
        propertyId: bookmarkNumberValues.propertyId,
        value: bookmarkNumberValues.value,
      })
      .from(bookmarkNumberValues)
      .where(inArray(bookmarkNumberValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkBooleanValues.bookmarkId,
        propertyId: bookmarkBooleanValues.propertyId,
        value: bookmarkBooleanValues.value,
      })
      .from(bookmarkBooleanValues)
      .where(inArray(bookmarkBooleanValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkDateTimeValues.bookmarkId,
        propertyId: bookmarkDateTimeValues.propertyId,
        value: bookmarkDateTimeValues.value,
      })
      .from(bookmarkDateTimeValues)
      .where(inArray(bookmarkDateTimeValues.bookmarkId, ids)),
  ]);

  const tagsByBid = new Map<string, Set<string>>();
  for (const r of tagRows) {
    const s = tagsByBid.get(r.bookmarkId) ?? new Set<string>();
    s.add(r.tagId);
    tagsByBid.set(r.bookmarkId, s);
  }

  const numsByBid = new Map<string, Map<string, number>>();
  for (const r of numberRows) {
    const m = numsByBid.get(r.bookmarkId) ?? new Map<string, number>();
    m.set(r.propertyId, r.value);
    numsByBid.set(r.bookmarkId, m);
  }

  const boolsByBid = new Map<string, Map<string, boolean>>();
  for (const r of booleanRows) {
    const m = boolsByBid.get(r.bookmarkId) ?? new Map<string, boolean>();
    m.set(r.propertyId, r.value);
    boolsByBid.set(r.bookmarkId, m);
  }

  const datesByBid = new Map<string, Map<string, string>>();
  for (const r of dateTimeRows) {
    const m = datesByBid.get(r.bookmarkId) ?? new Map<string, string>();
    m.set(r.propertyId, r.value);
    datesByBid.set(r.bookmarkId, m);
  }

  const result = new Map<string, ConditionInput>();
  for (const row of baseRows) {
    result.set(row.id, {
      url: row.url,
      title: row.title,
      categoryId: row.categoryId ?? defaultCategoryId,
      tagIds: tagsByBid.get(row.id) ?? new Set(),
      youtubeChannelId: row.youtubeChannelId ?? null,
      mediaTypeId: row.mediaTypeId ?? null,
      numberValues: numsByBid.get(row.id) ?? new Map(),
      booleanValues: boolsByBid.get(row.id) ?? new Map(),
      dateTimeValues: datesByBid.get(row.id) ?? new Map(),
    });
  }
  return result;
}
