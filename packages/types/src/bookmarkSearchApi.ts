import type { BookmarkSearch } from "./bookmarkSearch.js";
import type { BookmarkSearchScope } from "./bookmarkSearchScope.js";
import type { TitleSortContext } from "./bookmarkSortEngine.js";
import type { Bookmark } from "./index.js";

/**
 * The `POST /api/bookmarks/search` wire contract — shared so the client request builder and the
 * middleware route/service can't drift. The nested objects are narrowed server-side by
 * `validateBookmarkSearch` / `validateBookmarkSearchScope` (the body schema deliberately leaves
 * them free-form; see `routes/bookmarksSchema.ts`).
 */
export interface BookmarkSearchRequest {
  /** The shared facet filters; `search.sort` is the *effective* sort (the client resolves its default). */
  search: BookmarkSearch;
  /** Free-text query, matched against title/names/url/description/section names. */
  q?: string;
  /** 0-based index of the first result to return (default 0). */
  offset?: number;
  /** Page size (default 25, max 500). */
  limit?: number;
  /** The entity-scoped listing's scope (a category/tag/… page); absent on the main Bookmarks page. */
  scope?: BookmarkSearchScope;
  /** Title-sort language context — a per-page client preference, so it rides the request. */
  titleSort?: TitleSortContext;
}

export interface BookmarkSearchResult {
  /** The requested page, fully hydrated, in sorted order. */
  bookmarks: Bookmark[];
  /** Total matches before slicing (drives the client pager). */
  total: number;
  /**
   * Per-number-property `[min, max]` over the scoped (pre-facet, pre-text) set — the data bounds
   * the filter sidebar's range sliders fall back to when a property has no configured min/max.
   */
  numberBounds: Record<string, [number, number]>;
}
