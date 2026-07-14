import { desc, eq, ilike, like, or } from "drizzle-orm";
import type {
  BookmarkIdentityCheckInput,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
} from "@eesimple/types";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { getWebsiteByAnyDomain, normalizeDomain } from "@/services/websites";

/**
 * List bookmarks whose URL host equals `domain` (used to find links saved on a shortened domain so
 * they can be bulk-expanded). An `ILIKE` prefilter narrows the scan, then `normalizeDomain` confirms
 * the exact host so a substring like `youtu.be` can't match an unrelated URL.
 */
export async function listBookmarksOnHost(domain: string): Promise<BookmarkUrlSummary[]> {
  const host = domain.trim().replace(/^www\./i, "").toLowerCase();
  if (host.length === 0) return [];
  const rows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(ilike(bookmarks.url, `%${host}%`))
    .orderBy(desc(bookmarks.createdAt));
  return rows.filter(row => row.url != null && normalizeDomain(row.url) === host);
}

/** Bookmarks sharing any of the given Plex/Kavita/ISBN/feed identity fields. */
async function findIdentityMatches(identity: BookmarkIdentityCheckInput): Promise<BookmarkUrlSummary[]> {
  const conditions = [];
  if (identity.isbn) conditions.push(eq(bookmarks.isbn, identity.isbn));
  if (identity.plexRatingKey) conditions.push(eq(bookmarks.plexRatingKey, identity.plexRatingKey));
  if (identity.kavitaSeriesId != null) conditions.push(eq(bookmarks.kavitaSeriesId, identity.kavitaSeriesId));
  if (identity.feedUrl) conditions.push(eq(bookmarks.feedUrl, identity.feedUrl));
  if (conditions.length === 0) return [];

  return db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(or(...conditions));
}

/**
 * Check if a URL exactly matches an existing bookmark, shares the same origin+pathname, or shares a
 * Plex/Kavita/ISBN/podcast-feed identity with an existing bookmark (see #1072).
 */
export async function checkBookmarkUrlDuplicate(
  url?: string,
  identity?: BookmarkIdentityCheckInput,
): Promise<BookmarkUrlDuplicateResult> {
  const identityMatches = identity ? await findIdentityMatches(identity) : [];
  const withoutId = (id: string) => identityMatches.filter(m => m.id !== id);

  if (!url) return {
    exactMatch: null,
    pathMatch: null,
    identityMatches,
  };

  const exact = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(eq(bookmarks.url, url))
    .limit(1);
  if (exact.length > 0) return {
    exactMatch: exact[0]!,
    pathMatch: null,
    identityMatches: withoutId(exact[0]!.id),
  };

  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return {
      exactMatch: null,
      pathMatch: null,
      identityMatches,
    };
  }
  const basePath = parsed.origin + parsed.pathname;

  const candidates = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(like(bookmarks.url, `${basePath}%`));

  const pathCandidates = candidates.filter((b) => {
    if (!b.url) return false;
    try {
      const p = new URL(b.url);
      return p.origin + p.pathname === basePath;
    }
    catch { return false; }
  });

  if (pathCandidates.length === 0) return {
    exactMatch: null,
    pathMatch: null,
    identityMatches,
  };

  // Look up paramRules for this domain so identity-bearing params (e.g. YouTube's ?v= on /watch)
  // are included in the match. Uses getWebsiteByAnyDomain so youtu.be resolves to youtube.com.
  const domain = normalizeDomain(url);
  const website = domain ? await getWebsiteByAnyDomain(domain) : null;

  // Find the most-specific matching rule (longest pathSuffix wins, mirrors urlCleanup applyParamRules).
  const matchingRule = website?.paramRules.length
    ? website.paramRules
      .filter(r => r.pathSuffix === "" || (
        r.matchMode === "contains"
          ? parsed.pathname.includes(r.pathSuffix)
          : parsed.pathname.endsWith(r.pathSuffix)
      ))
      .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0] ?? null
    : null;

  if (!matchingRule) {
    const pathMatch = pathCandidates[0] ?? null;
    return {
      exactMatch: null,
      pathMatch,
      identityMatches: pathMatch ? withoutId(pathMatch.id) : identityMatches,
    };
  }

  // Only flag a candidate as a path-match when all identity params also match.
  const newParamValues = matchingRule.params.map(p => parsed.searchParams.get(p) ?? "");
  const pathMatch = pathCandidates.find((b) => {
    if (!b.url) return false;
    try {
      const bp = new URL(b.url);
      return matchingRule.params.every((p, i) => (bp.searchParams.get(p) ?? "") === newParamValues[i]);
    }
    catch { return false; }
  }) ?? null;

  return {
    exactMatch: null,
    pathMatch,
    identityMatches: pathMatch ? withoutId(pathMatch.id) : identityMatches,
  };
}
