import type {
  BookmarkSearch,
  BookmarkSearchScope,
  TitleSortContext,
} from "@eesimple/types";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { bookmarksApi } from "../lib/api/bookmarks";

export interface BookmarkServerSearchArgs {
  /** The facet filters with the *effective* sort already resolved (`search.sort ?? default`). */
  search: BookmarkSearch;
  /** Already-debounced free-text query (the caller owns the debounce so it enters the key once). */
  q: string;
  offset: number;
  limit: number;
  scope?: BookmarkSearchScope;
  titleSort: TitleSortContext;
}

/**
 * The server-side bookmark search behind every listing surface (`POST /api/bookmarks/search`):
 * scope + facets + free text + sort + pagination all evaluate in the middleware; the client
 * receives one page plus the total. Keyed under the `["bookmarks"]` root so every existing
 * bookmark-mutation invalidation refetches the visible page for free, and kept on
 * `keepPreviousData` so page/filter transitions swap without flicker.
 */
export function useBookmarkServerSearch(args: BookmarkServerSearchArgs) {
  const {
    search, q, offset, limit, scope, titleSort,
  } = args;
  const query = useQuery({
    queryKey: ["bookmarks", "search", {
      search,
      q,
      offset,
      limit,
      scope: scope ?? null,
      titleSort,
    }],
    queryFn: () => bookmarksApi.search({
      search,
      q: q || undefined,
      offset,
      limit,
      scope,
      titleSort,
    }),
    placeholderData: keepPreviousData,
  });

  return {
    bookmarks: query.data?.bookmarks,
    total: query.data?.total,
    numberBounds: query.data?.numberBounds,
    isLoading: query.isLoading,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
  };
}
