/**
 * The bookmark cache's invalidation counter, split into a leaf module so writers that the cache
 * itself loads from (e.g. `services/categories.ts`, whose `ensureDefaultCategory` the cache calls)
 * can invalidate without a circular import. Most writers import `invalidateBookmarkCache` via
 * `services/bookmarkCache.ts`, which re-exports it.
 */

let version = 0;

/**
 * Mark the cached bookmark evaluation data stale so the next `getBookmarkEvaluationData` call
 * rebuilds it. Cheap (a counter bump) — the rebuild is deferred to the next read.
 */
export function invalidateBookmarkCache(): void {
  version += 1;
}

/** The current invalidation counter (read by the cache to detect staleness). */
export function bookmarkCacheVersion(): number {
  return version;
}
