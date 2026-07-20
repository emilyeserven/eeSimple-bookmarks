import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, BookmarkSearchScope, Category, CustomProperty, GenreMood, MediaType, PlaceType, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { useEffect } from "react";

import { useBookmarksPerPage, useDefaultBookmarkSort } from "../hooks/useAppSettings";
import { useBookmarkServerSearch } from "../hooks/useBookmarkServerSearch";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSetListingPage } from "../hooks/useListingPage";
import { usePageTitleSort } from "../hooks/useTitleSortContext";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { fillRowsPageSize } from "../lib/serverPagination";
import { useClampedPageWindow, useServerPagination } from "../lib/useServerPagination";
import { useUiStore } from "../stores/uiStore";

/** The filter-context payload shared with the sort control + CMD+K palette via the UI store. */
export interface BookmarkSearchViewData {
  pageKey: string;
  tree: TagNode[];
  properties: CustomProperty[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  relationshipTypes?: RelationshipType[];
  people?: Person[];
  placeTypes?: PlaceType[];
  genreMoods?: GenreMood[];
  /** The entity-scoped listing's scope, evaluated server-side; absent on the main Bookmarks page. */
  scope?: BookmarkSearchScope;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  /** When set, the header Add Bookmark modal locks new bookmarks to this category (category pages). */
  addFormCategoryId?: string;
}

export interface BookmarkSearchViewState {
  /** Per-page column count for the listing grid. */
  columns: number;
  /** The current server page of matching bookmarks. */
  bookmarks: Bookmark[];
  /** Total matches across all pages (drives the pager). */
  total: number;
  page: number;
  totalPages: number;
  /** 1-indexed range of the visible page within the total (0/0 when empty). */
  rangeStart: number;
  rangeEnd: number;
  setPage: (page: number) => void;
  /** Server-reported per-property `[min, max]` for the filter sliders. */
  numberBounds: Record<string, [number, number]> | undefined;
  /** True when the header quick-search has a non-empty (debounced) query. */
  textSearchActive: boolean;
  isLoading: boolean;
  error: Error | null;
}

/** Publishes the filter-context payload the sort control + CMD+K palette read from the UI store. */
function useBookmarkFilterContext(data: BookmarkSearchViewData, bookmarks: Bookmark[]): void {
  const {
    tree, properties, categories, mediaTypes, youtubeChannels, websites,
    relationshipTypes, people, placeTypes, genreMoods, search, onSearchChange,
  } = data;
  const setFilterContext = useUiStore(state => state.setFilterContext);

  useEffect(() => {
    setFilterContext({
      tree,
      properties,
      categories,
      mediaTypes,
      youtubeChannels,
      websites,
      relationshipTypes,
      people,
      placeTypes,
      genreMoods,
      bookmarks,
      search,
      onSearchChange,
    });
    return () => setFilterContext(null);
    // onSearchChange is a new arrow fn each render from the page; stable deps are the data arrays
  }, [tree, properties, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, people, placeTypes, genreMoods, bookmarks, search, onSearchChange, setFilterContext]);
}

/**
 * Owns the hook-dense state orchestration for {@link BookmarkSearchView}: the listing-page
 * registration, the debounced header search, the server-search query (facets + free text + sort +
 * pagination all evaluate in the middleware — see `POST /api/bookmarks/search`), the page state,
 * and the filter-context publish/cleanup — leaving the view component a thin render shell.
 */
export function useBookmarkSearchView(data: BookmarkSearchViewData): BookmarkSearchViewState {
  const {
    pageKey, search, scope, addFormCategoryId,
  } = data;

  // The section-display control is offered on any tag listing page — the Tagged sections chips
  // resolve against the tag's subtree there, so the modes are meaningful even outside the
  // `?taggedSections` filter.
  const showsSectionDisplay = scope?.kind === "tag";
  useSetListingPage(pageKey, {
    showsImages: true,
    hasFilters: true,
    showsCards: true,
    hasSort: true,
    showsSectionDisplay,
    addBookmark: {
      categoryId: addFormCategoryId,
    },
  });
  const columns = useBookmarkColumns(pageKey);
  const viewMode = useViewMode(pageKey);
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);
  const q = useDebouncedValue(headerSearchQuery.trim().toLowerCase());

  const perPage = useBookmarksPerPage();
  const defaultSort = useDefaultBookmarkSort();
  const titleSort = usePageTitleSort(pageKey);

  // In the card/gallery grid, round the page size up to a whole multiple of the column count so the
  // last row fills (25 @ 3 cols → 27). Table view has no columns, so it keeps the raw page size.
  const effectivePerPage = viewMode === "table" ? perPage : fillRowsPageSize(perPage, columns);

  const serverSearch = {
    ...search,
    sort: search.sort ?? defaultSort ?? undefined,
  };
  // `effectivePerPage` is in the reset key so changing the column count (or page size) snaps to page 1.
  const resetKey = `${pageKey}|${q}|${effectivePerPage}|${JSON.stringify(search)}`;
  const pager = useServerPagination(effectivePerPage, resetKey);

  const result = useBookmarkServerSearch({
    search: serverSearch,
    q,
    offset: pager.offset,
    limit: effectivePerPage,
    scope,
    titleSort,
  });
  const bookmarks = result.bookmarks ?? [];
  const total = result.total ?? 0;
  const window = useClampedPageWindow(pager, result.total, effectivePerPage);

  useBookmarkFilterContext(data, bookmarks);

  return {
    columns,
    bookmarks,
    total,
    page: window.page,
    totalPages: window.totalPages,
    rangeStart: window.rangeStart,
    rangeEnd: window.rangeStart === 0 ? 0 : window.offset + bookmarks.length,
    setPage: pager.setPage,
    numberBounds: result.numberBounds,
    textSearchActive: q !== "",
    isLoading: result.isLoading,
    error: result.error,
  };
}
