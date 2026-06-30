import type { BulkAutoFetchResult } from "@eesimple/types";

/**
 * Run `fetchOne` over `items` in batches of 3 concurrent requests (to avoid hammering external
 * servers), reporting how many succeeded vs. failed. `onProgress` is called after each batch with
 * the running total of processed items. Shared by the bookmark-image and YouTube-channel-image
 * bulk auto-fetch jobs. `fetchOne` receives the full item (not just its id) so callers can pass
 * along fields the eligibility query already selected, avoiding a redundant per-item re-fetch.
 */
export async function batchFetch<T>(
  items: T[],
  fetchOne: (item: T) => Promise<unknown>,
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  let fetched = 0;
  let failed = 0;
  let processed = 0;
  const BATCH = 3;
  for (let i = 0; i < items.length; i += BATCH) {
    const results = await Promise.allSettled(
      items.slice(i, i + BATCH).map(item => fetchOne(item)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") fetched++;
      else failed++;
      processed++;
    }
    onProgress?.(processed, items.length);
  }
  return {
    fetched,
    failed,
  };
}
