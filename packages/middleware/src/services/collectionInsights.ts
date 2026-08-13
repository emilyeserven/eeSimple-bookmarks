/**
 * Collection Insights — the read-only aggregate snapshot behind `GET /api/insights`. Loads small
 * column selections and aggregates in pure JS (the "load once → aggregate in-memory" pattern), so
 * the helpers are unit-testable without a live database. Display-only, nothing matchable — never
 * touches `invalidateBookmarkCache()` (the `databaseUsage.ts` / `linkHealth.ts` carve-out).
 */

import type { CollectionInsights, InsightsBreakdown, InsightsMonthPoint } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, categories, mediaTypes, tags, websites } from "@/db/schema";

/** The columns of a bookmark row the aggregations read. */
interface InsightsBookmarkRow {
  createdAt: Date;
  categoryId: string | null;
  mediaTypeId: string | null;
  websiteId: string | null;
  linkCheckStatus: string | null;
}

/** The display fields a breakdown needs for one group (a category / media type / website). */
interface InsightsGroup {
  name: string;
  /** Nullable at the DB level (backfilled at boot); a group without one renders unlinked. */
  slug: string | null;
}

/** How many groups a breakdown lists before collapsing the tail into `otherCount`. */
const BREAKDOWN_TOP_N = 8;

/** UTC `"YYYY-MM"` key for a date. */
function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** The last 12 UTC `"YYYY-MM"` keys ending at `now`'s month, oldest first. */
export function lastTwelveMonths(now: Date): string[] {
  const months: string[] = [];
  for (let back = 11; back >= 0; back--) {
    months.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1))));
  }
  return months;
}

/**
 * Bucket bookmark creations into the trailing 12 months, zero-filled and oldest first. Rows
 * outside the window are dropped from the chart (they still count in the totals).
 */
export function bucketAddedPerMonth(
  rows: readonly { createdAt: Date }[],
  now: Date,
): InsightsMonthPoint[] {
  const counts = new Map<string, number>(lastTwelveMonths(now).map(month => [month, 0]));
  for (const row of rows) {
    const key = monthKey(row.createdAt);
    const current = counts.get(key);
    if (current !== undefined) counts.set(key, current + 1);
  }
  return [...counts.entries()].map(([month, count]) => ({
    month,
    count,
  }));
}

/**
 * Tally bookmarks per FK value into a top-N breakdown: descending by count with a name tie-break
 * (deterministic output), the tail summed into `otherCount`, and NULL — or an id missing from
 * `groups`, which shouldn't occur since the FKs null on delete — into `noneCount`.
 */
export function buildBreakdown(
  rows: readonly InsightsBookmarkRow[],
  fk: "categoryId" | "mediaTypeId" | "websiteId",
  groups: ReadonlyMap<string, InsightsGroup>,
  topN = BREAKDOWN_TOP_N,
): InsightsBreakdown {
  const counts = new Map<string, number>();
  let noneCount = 0;
  for (const row of rows) {
    const id = row[fk];
    if (id === null || !groups.has(id)) {
      noneCount++;
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const sorted = [...counts.entries()]
    .map(([id, count]) => ({
      id,
      name: groups.get(id)?.name ?? "",
      slug: groups.get(id)?.slug ?? null,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return {
    slices: sorted.slice(0, topN),
    otherCount: sorted.slice(topN).reduce((sum, slice) => sum + slice.count, 0),
    noneCount,
  };
}

/** Index a taxonomy's `{ id, name, slug }` selection by id for `buildBreakdown`. */
function toGroupMap(
  rows: readonly { id: string;
    name: string;
    slug: string | null; }[],
): Map<string, InsightsGroup> {
  return new Map(rows.map(row => [row.id, {
    name: row.name,
    slug: row.slug,
  }]));
}

/** Load and aggregate the whole `/insights` snapshot. */
export async function getCollectionInsights(now = new Date()): Promise<CollectionInsights> {
  const [bookmarkRows, categoryRows, mediaTypeRows, websiteRows, tagRows] = await Promise.all([
    db.select({
      createdAt: bookmarks.createdAt,
      categoryId: bookmarks.categoryId,
      mediaTypeId: bookmarks.mediaTypeId,
      websiteId: bookmarks.websiteId,
      linkCheckStatus: bookmarks.linkCheckStatus,
    }).from(bookmarks),
    db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    }).from(categories),
    db.select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      slug: mediaTypes.slug,
    }).from(mediaTypes),
    db.select({
      id: websites.id,
      name: websites.siteName,
      slug: websites.slug,
    }).from(websites),
    db.select({
      id: tags.id,
    }).from(tags),
  ]);

  const categoryGroups = toGroupMap(categoryRows);
  const mediaTypeGroups = toGroupMap(mediaTypeRows);
  const websiteGroups = toGroupMap(websiteRows);

  return {
    totals: {
      bookmarks: bookmarkRows.length,
      categories: categoryRows.length,
      tags: tagRows.length,
      websites: websiteRows.length,
      brokenLinks: bookmarkRows.filter(row => row.linkCheckStatus === "broken").length,
    },
    addedPerMonth: bucketAddedPerMonth(bookmarkRows, now),
    byCategory: buildBreakdown(bookmarkRows, "categoryId", categoryGroups),
    byMediaType: buildBreakdown(bookmarkRows, "mediaTypeId", mediaTypeGroups),
    topWebsites: buildBreakdown(bookmarkRows, "websiteId", websiteGroups),
    capturedAt: new Date().toISOString(),
  };
}
