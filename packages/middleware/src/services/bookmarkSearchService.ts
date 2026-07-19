import { desc, inArray } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkSearch,
  BookmarkSearchResult,
  BookmarkSearchScope,
  TitleSortContext,
} from "@eesimple/types";
import {
  bookmarkMatchesScope,
  bookmarkMatchesSearch,
  bookmarkMatchesText,
  sortBookmarks,
} from "@eesimple/types";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { getBookmarkEvaluationData } from "@/services/bookmarkCache";
import { bookmarkCacheVersion } from "@/services/bookmarkCacheVersion";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
import { listCustomProperties } from "@/services/customProperties";

/** The `POST /api/bookmarks/search` request, after the shared validators have narrowed the body. */
export interface BookmarkSearchServiceInput {
  /** The shared facet filters; `search.sort` is the *effective* sort (the client resolves its default). */
  search: BookmarkSearch;
  /** Free-text query (matched against title/names/url/description/section names). */
  q?: string;
  offset: number;
  limit: number;
  /** The entity-scoped listing's scope (a category/tag/… page); absent on the main Bookmarks page. */
  scope?: BookmarkSearchScope;
  /** Title-sort language context — a per-page client preference, so it rides the request. */
  titleSort?: TitleSortContext;
}

/**
 * In-memory cache of every bookmark fully hydrated, memoized per {@link bookmarkCacheVersion} with
 * the same publish-only-if-version-unchanged discipline as `getBookmarkEvaluationData`. Used only
 * for *matching and sorting* — every matchable write bumps the version, so stale entries can't
 * affect which bookmarks a search returns. The rows actually returned to the client are re-hydrated
 * fresh per request (see {@link searchBookmarks}), so display-only writes that don't bump the
 * version (images, screenshots) never serve stale data. Memory-wise this holds one copy of the set
 * the client used to download whole on every listing visit.
 */
let hydratedSnapshot: { version: number;
  bookmarks: Bookmark[]; } | null = null;

async function getHydratedBookmarks(): Promise<Bookmark[]> {
  if (hydratedSnapshot && hydratedSnapshot.version === bookmarkCacheVersion()) {
    return hydratedSnapshot.bookmarks;
  }
  const target = bookmarkCacheVersion();
  // Explicit newest-first order: this is the "no sort" default the client expects.
  const rows = await db.select().from(bookmarks).orderBy(desc(bookmarks.createdAt));
  const hydrated = await hydrateBookmarkRows(rows);
  if (target === bookmarkCacheVersion()) {
    hydratedSnapshot = {
      version: target,
      bookmarks: hydrated,
    };
  }
  return hydrated;
}

/** Test seam: drop the hydrated snapshot (mirrors an out-of-band version bump). */
export function resetHydratedBookmarkCache(): void {
  hydratedSnapshot = null;
}

/**
 * Whether a bookmark passes the tag-*inclusion* filter (`search.tags` outside "exclude" mode),
 * expanded to each tag's whole subtree — the semantics `listBookmarks(filterTagIds)` implements in
 * SQL. The shared facet table deliberately leaves inclusion to the data source, so the search
 * service reproduces it here; presence/exclude stay inside `bookmarkMatchesSearch`.
 */
function passesTagInclusion(
  bookmark: Bookmark,
  search: BookmarkSearch,
  tagDescendants: (id: string) => Set<string>,
): boolean {
  if (!search.tags || search.tags.length === 0 || search.tagPresence === "exclude") return true;
  const allowed = new Set<string>();
  for (const id of search.tags) {
    for (const descendantId of tagDescendants(id)) allowed.add(descendantId);
  }
  return bookmark.tags.some(tag => allowed.has(tag.id));
}

/** Per-property `[min, max]` over the scoped set's number values (the sliders' data bounds). */
function computeNumberBounds(scoped: Bookmark[]): Record<string, [number, number]> {
  const bounds: Record<string, [number, number]> = {};
  for (const bookmark of scoped) {
    for (const entry of bookmark.numberValues) {
      const current = bounds[entry.propertyId];
      if (!current) {
        bounds[entry.propertyId] = [entry.value, entry.value];
      }
      else {
        if (entry.value < current[0]) current[0] = entry.value;
        if (entry.value > current[1]) current[1] = entry.value;
      }
    }
  }
  return bounds;
}

/**
 * Server-side bookmark search: scope → tag inclusion → shared facets → free text → shared sort →
 * slice → fresh hydration of just the page. Matching runs over the version-cached hydrated set with
 * the exact same `@eesimple/types` predicates the client used to run in-memory, so moving the work
 * server-side changed where it runs, never what it matches (CLAUDE.md → "Data shaping").
 */
export async function searchBookmarks(
  input: BookmarkSearchServiceInput,
): Promise<BookmarkSearchResult> {
  const [all, evaluation, properties] = await Promise.all([
    getHydratedBookmarks(),
    getBookmarkEvaluationData(),
    listCustomProperties(),
  ]);

  const scope = input.scope;
  const scoped = scope
    ? all.filter(bookmark => bookmarkMatchesScope(bookmark, scope, {
      tagDescendants: evaluation.tagDescendants,
      locationDescendants: evaluation.locationDescendants,
      taxonomyTermDescendants: evaluation.taxonomyTermDescendants,
    }))
    : all;

  const q = input.q?.trim().toLowerCase() ?? "";
  const matches = scoped.filter(bookmark =>
    passesTagInclusion(bookmark, input.search, evaluation.tagDescendants)
    && bookmarkMatchesSearch(bookmark, input.search)
    && bookmarkMatchesText(bookmark, q));

  const sorted = sortBookmarks(matches, input.search.sort, properties, input.titleSort ?? {});
  const page = sorted.slice(input.offset, input.offset + input.limit);

  // Fresh hydration of just the page: display-only fields (images, screenshots) don't bump the
  // cache version, so the response must not come from the matching cache.
  const pageIds = page.map(bookmark => bookmark.id);
  const hydrated = pageIds.length > 0
    ? await hydrateBookmarkRows(
      await db.select().from(bookmarks).where(inArray(bookmarks.id, pageIds)),
    )
    : [];
  const hydratedById = new Map(hydrated.map(bookmark => [bookmark.id, bookmark]));
  const pageBookmarks = pageIds
    .map(id => hydratedById.get(id))
    .filter((bookmark): bookmark is Bookmark => bookmark !== undefined);

  return {
    bookmarks: pageBookmarks,
    total: sorted.length,
    numberBounds: computeNumberBounds(scoped),
  };
}
