/**
 * Link Health — on-demand dead-link checking. Probes each bookmark URL's reachability via
 * `unwrapRedirect` (HEAD with GET fallback, SSRF-guarded redirect following, shared timeout) and
 * persists the outcome on the bookmark row. The result columns are display-only maintenance data,
 * so no write here calls `invalidateBookmarkCache()` — the same carve-out as the
 * `imageAutoGrabError` writes in `services/bookmarkImages.ts` (link status is not matchable, and
 * search re-hydrates page rows freshly).
 */

import { asc, eq, isNotNull } from "drizzle-orm";
import type { BrokenBookmark, BulkAutoFetchResult, LinkRecheckResult } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { batchFetch } from "@/services/batchFetch";
import type { UnwrapResult } from "@/services/redirectUnwrap";
import { unwrapRedirect } from "@/services/redirectUnwrap";
import { NotFoundError } from "@/utils/errors";

/**
 * Classify a probe outcome into the persisted link-check shape: `ok` is alive; an HTTP error
 * records its status code; timeout/network-error/blocked record the error kind.
 */
export function classifyUnwrapResult(result: UnwrapResult): { status: "ok" | "broken";
  detail: string | null; } {
  if (result.kind === "ok") return {
    status: "ok",
    detail: null,
  };
  return {
    status: "broken",
    detail: result.kind === "http_error" ? String(result.status) : result.kind,
  };
}

/** Bookmarks with a URL to probe — URL-less bookmarks (e.g. franchise hubs) are skipped. */
async function eligibleLinkCheckBookmarks(): Promise<{ id: string;
  url: string | null; }[]> {
  return db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
    })
    .from(bookmarks)
    .where(isNotNull(bookmarks.url));
}

/**
 * Probe one bookmark's URL and persist the outcome. Throws when the link is broken so
 * `batchFetch`'s allSettled tally reports `{ fetched: alive, failed: broken }`.
 */
async function checkOneBookmarkLink({
  id, url,
}: { id: string;
  url: string | null; }): Promise<void> {
  if (url === null) return;
  const {
    status, detail,
  } = classifyUnwrapResult(await unwrapRedirect(url));
  await db.update(bookmarks).set({
    linkCheckStatus: status,
    linkCheckDetail: detail,
    linkCheckedAt: new Date(),
  }).where(eq(bookmarks.id, id));
  if (status === "broken") throw new Error(detail ?? "broken");
}

/**
 * Check every eligible bookmark's link in batches of 3 concurrent requests. Returns how many
 * links were alive (`fetched`) vs. broken (`failed`).
 */
export async function bulkCheckBookmarkLinks(
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  const eligible = await eligibleLinkCheckBookmarks();
  return batchFetch(eligible, checkOneBookmarkLink, onProgress);
}

/** Every bookmark whose last link check failed, ordered by title. */
export async function listBrokenBookmarks(): Promise<BrokenBookmark[]> {
  const rows = await db
    .select({
      id: bookmarks.id,
      title: bookmarks.title,
      url: bookmarks.url,
      detail: bookmarks.linkCheckDetail,
      checkedAt: bookmarks.linkCheckedAt,
    })
    .from(bookmarks)
    .where(eq(bookmarks.linkCheckStatus, "broken"))
    .orderBy(asc(bookmarks.title));
  return rows
    .filter((row): row is typeof row & { url: string } => row.url !== null)
    .map(row => ({
      id: row.id,
      title: row.title,
      url: row.url,
      detail: row.detail,
      checkedAt: row.checkedAt?.toISOString() ?? null,
    }));
}

/** Re-check a single bookmark's link on demand and persist + return the outcome. */
export async function recheckBookmarkLink(id: string): Promise<LinkRecheckResult> {
  const [row] = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, id));
  if (!row || row.url === null) throw new NotFoundError("Bookmark");
  const {
    status, detail,
  } = classifyUnwrapResult(await unwrapRedirect(row.url));
  const checkedAt = new Date();
  await db.update(bookmarks).set({
    linkCheckStatus: status,
    linkCheckDetail: detail,
    linkCheckedAt: checkedAt,
  }).where(eq(bookmarks.id, id));
  return {
    status,
    detail,
    checkedAt: checkedAt.toISOString(),
  };
}
