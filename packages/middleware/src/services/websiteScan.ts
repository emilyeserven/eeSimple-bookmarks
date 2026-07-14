import { asc, eq, inArray } from "drizzle-orm";
import type { DetectedScanObservation, RedirectFailureBookmark, RedirectFailureWebsite, WebsiteScanObservation } from "@eesimple/types";
import { mergeScanObservations } from "@eesimple/types";
import { db } from "@/db";
import { bookmarkImages, bookmarks, categories, websiteFavicons, websites } from "@/db/schema";
import {
  faviconUrlFrom,
  matchesAnyDomain,
  normalizeDomain,
  slugFromDomain,
  takenWebsiteSlugs,
  type Tx,
  uniqueWebsiteSlug,
  websiteSelect,
} from "@/services/websiteHelpers";

/**
 * Resolve the website for a URL inside a transaction, creating it when none exists yet.
 * `siteName` sets the friendly name for the new site; defaults to the domain when omitted.
 * Returns the website id, or `null` when the URL has no host.
 */
export async function ensureWebsiteForUrl(tx: Tx, url: string, siteName?: string): Promise<string | null> {
  const domain = normalizeDomain(url);
  if (!domain) return null;

  // Match by canonical domain OR a verified shortened link, so e.g. a kept `youtu.be` bookmark
  // associates with the existing `youtube.com` site instead of creating a `youtu.be` website.
  const [existing] = await tx
    .select({
      id: websites.id,
    })
    .from(websites)
    .where(matchesAnyDomain(domain));
  if (existing) return existing.id;

  // Generate a slug before inserting (read outside tx is safe — backfill covers edge cases).
  const taken = await takenWebsiteSlugs();
  const slug = uniqueWebsiteSlug(slugFromDomain(domain), taken);

  const inserted = await tx
    .insert(websites)
    .values({
      domain,
      siteName: siteName?.trim() || domain,
      slug,
    })
    .onConflictDoNothing({
      target: websites.domain,
    })
    .returning({
      id: websites.id,
    });
  if (inserted.length > 0) return inserted[0].id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  const [row] = await tx
    .select({
      id: websites.id,
    })
    .from(websites)
    .where(eq(websites.domain, domain));
  return row?.id ?? null;
}

/**
 * Record scanner-detected observations onto a website (the sole scanner → website write-back). Merges
 * the freshly-detected facts into the stored list — refreshing scanner entries, preserving manual
 * ones — and writes only when something changed. Display/diagnostic data only: it never touches the
 * bookmark cache. `now` is an ISO-8601 timestamp supplied by the caller.
 */
export async function recordWebsiteScanObservations(
  websiteId: string,
  detected: DetectedScanObservation[],
  now: string,
): Promise<void> {
  if (detected.length === 0) return;
  const [row] = await db.select({
    scanObservations: websites.scanObservations,
  }).from(websites).where(eq(websites.id, websiteId));
  if (!row) return;
  const current = (row.scanObservations as WebsiteScanObservation[] | null) ?? [];
  const merged = mergeScanObservations(current, detected, now);
  if (!merged) return;
  await db.update(websites).set({
    scanObservations: merged,
  }).where(eq(websites.id, websiteId));
}

/** How many websites have the "Scan URL for ISBN" flag on. Powers the Scan Pipeline status page. */
export async function countWebsitesWithScanUrlForIsbn(): Promise<number> {
  return db.$count(websites, eq(websites.scanUrlForIsbn, true));
}

/**
 * Return websites flagged for redirect resolution failure, each with their associated bookmarks
 * (id, url, title, description, imageUrl). Ordered by site name; bookmarks ordered by title.
 */
export async function listRedirectFailureWebsites(): Promise<RedirectFailureWebsite[]> {
  const flaggedRows = await db
    .select(websiteSelect)
    .from(websites)
    .leftJoin(websiteFavicons, eq(websiteFavicons.websiteId, websites.id))
    .leftJoin(categories, eq(categories.id, websites.categoryId))
    .where(eq(websites.redirectResolutionFailure, true))
    .orderBy(asc(websites.siteName));

  if (flaggedRows.length === 0) return [];

  const websiteIds = flaggedRows.map(r => r.id);
  const bookmarkRows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
      description: bookmarks.description,
      websiteId: bookmarks.websiteId,
      imageObjectKey: bookmarkImages.objectKey,
    })
    .from(bookmarks)
    .leftJoin(bookmarkImages, eq(bookmarkImages.bookmarkId, bookmarks.id))
    .where(inArray(bookmarks.websiteId, websiteIds))
    .orderBy(asc(bookmarks.title));

  const bookmarksByWebsite = new Map<string, RedirectFailureBookmark[]>();
  for (const bm of bookmarkRows) {
    if (!bm.websiteId) continue;
    const list = bookmarksByWebsite.get(bm.websiteId) ?? [];
    list.push({
      id: bm.id,
      url: bm.url,
      title: bm.title,
      description: bm.description,
      imageUrl: bm.imageObjectKey ? `/api/bookmarks/${bm.id}/image` : null,
    });
    bookmarksByWebsite.set(bm.websiteId, list);
  }

  return flaggedRows.map(site => ({
    id: site.id,
    domain: site.domain,
    siteName: site.siteName,
    slug: site.slug ?? slugFromDomain(site.domain),
    imageUrl: faviconUrlFrom(site.id, site.faviconCreatedAt ?? null),
    bookmarks: bookmarksByWebsite.get(site.id) ?? [],
  }));
}
