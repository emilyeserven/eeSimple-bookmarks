/**
 * Collection Insights — the read-only `/insights` dashboard payload. Aggregation happens
 * middleware-side (`GET /api/insights` returns a render-ready snapshot); `otherCount`/`noneCount`
 * are plain numbers rather than sentinel slices so the client supplies their translated labels.
 */

/** Headline counts across the whole collection. */
export interface CollectionInsightsTotals {
  bookmarks: number;
  categories: number;
  tags: number;
  websites: number;
  /** Bookmarks whose last Link Health check failed (`linkCheckStatus === "broken"`). */
  brokenLinks: number;
}

/** One month's bookmark-creation count; `month` is a UTC `"YYYY-MM"` key. */
export interface InsightsMonthPoint {
  month: string;
  count: number;
}

/** One named group in a breakdown (a category / media type / website) with its bookmark count. */
export interface InsightsSlice {
  id: string;
  name: string;
  /**
   * URL slug of the group's own entity page, so the client can deep-link the row. `null` for a row
   * whose entity has no slug yet (the columns are nullable and backfilled at boot) — such a row
   * renders as plain text rather than a link.
   */
  slug: string | null;
  count: number;
}

/** A top-N breakdown of bookmarks over one FK, with the tail and the unset rows summed. */
export interface InsightsBreakdown {
  /** Top N groups, descending by count (name tie-break for determinism). */
  slices: InsightsSlice[];
  /** Bookmarks in groups beyond the top N. */
  otherCount: number;
  /** Bookmarks with no value for the FK (plus, defensively, values that no longer resolve). */
  noneCount: number;
}

/** The full `/insights` dashboard snapshot. */
export interface CollectionInsights {
  totals: CollectionInsightsTotals;
  /** Exactly 12 months, zero-filled, oldest first. */
  addedPerMonth: InsightsMonthPoint[];
  byCategory: InsightsBreakdown;
  byMediaType: InsightsBreakdown;
  topWebsites: InsightsBreakdown;
  capturedAt: string;
}
