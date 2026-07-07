import type { BookmarkSort } from "../lib/bookmarkSort";
import type { ViewMode } from "../stores/uiStore";

import { DEFAULT_BOOKMARK_COLUMNS, DEFAULT_VIEW_MODE } from "../lib/bookmarkColumns";
import { withSort } from "../lib/bookmarkSearch";
import { clampColumns, useUiStore } from "../stores/uiStore";

/** Listing-page display state (view mode, columns, sort, bulk select) for the CMD+K palette. */
export function useListingPageContext() {
  const listingPage = useUiStore(s => s.listingPage);
  const pageKey = listingPage?.key ?? "";

  const currentViewMode = useUiStore(s => s.viewMode[pageKey] ?? DEFAULT_VIEW_MODE);
  const currentColumns = useUiStore(s => s.bookmarkColumns[pageKey] ?? DEFAULT_BOOKMARK_COLUMNS);
  const setViewModeFn = useUiStore(s => s.setViewMode);
  const setColumnsFn = useUiStore(s => s.setBookmarkColumns);
  const filterContext = useUiStore(s => s.filterContext);
  const currentSort = filterContext?.search.sort;

  const bulkSelectPageKey = useUiStore(s => s.bulkSelectPageKey);
  const selectionMode = useUiStore(s =>
    bulkSelectPageKey ? (s.selectionMode[bulkSelectPageKey] ?? false) : false);
  const setSelectionModeFn = useUiStore(s => s.setSelectionMode);

  return {
    listingPage,
    currentViewMode,
    currentColumns,
    setViewMode: (m: ViewMode) => setViewModeFn(pageKey, m),
    setColumns: (n: number) => setColumnsFn(pageKey, clampColumns(n)),
    currentSort,
    setSort: (s: BookmarkSort) => {
      if (filterContext) filterContext.onSearchChange(withSort(filterContext.search, s));
    },
    clearSort: () => {
      if (filterContext) filterContext.onSearchChange(withSort(filterContext.search, undefined));
    },
    bulkSelectPageKey,
    selectionMode,
    setSelectionMode: (on: boolean) => {
      if (bulkSelectPageKey) setSelectionModeFn(bulkSelectPageKey, on);
    },
  };
}
