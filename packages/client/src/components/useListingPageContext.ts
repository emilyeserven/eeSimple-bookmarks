import type { BookmarkSort } from "../lib/bookmarkSort";
import type { ViewMode } from "../stores/uiStore";

import {
  useDisplayPreferenceSettings,
  useFiltersHidden,
  useFiltersInDrawer,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { DEFAULT_BOOKMARK_COLUMNS, DEFAULT_VIEW_MODE } from "../lib/bookmarkColumns";
import { withSort } from "../lib/bookmarkSearch";
import { clampColumns, useUiStore } from "../stores/uiStore";
import { usePanelControls } from "./panel/usePanelControls";

export type FilterLocation = "sidebar" | "drawer" | "hide";

const FILTER_LOCATION_PATCH: Record<FilterLocation, {
  filtersHidden: boolean;
  filtersInDrawer: boolean;
  message: string;
}> = {
  sidebar: {
    filtersHidden: false,
    filtersInDrawer: false,
    message: "Filters in sidebar",
  },
  drawer: {
    filtersHidden: false,
    filtersInDrawer: true,
    message: "Filters in drawer",
  },
  hide: {
    filtersHidden: true,
    filtersInDrawer: false,
    message: "Filters hidden",
  },
};

/** Listing-page display state (view mode, columns, filter location, bulk select) for the CMD+K palette. */
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

  const filtersHidden = useFiltersHidden();
  const filtersInDrawer = useFiltersInDrawer();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const {
    openType, close, dCT,
  } = usePanelControls();

  const filterLocation: FilterLocation = filtersHidden ? "hide" : filtersInDrawer ? "drawer" : "sidebar";

  function setFilterLocation(next: FilterLocation) {
    if (!displayData) return;
    const {
      filtersHidden: h, filtersInDrawer: d, message,
    } = FILTER_LOCATION_PATCH[next];
    update.mutate({
      input: {
        ...displayData,
        filtersHidden: h,
        filtersInDrawer: d,
      },
      successMessage: message,
    });
    if (next === "sidebar" && dCT === "filters") close();
    else if (next === "drawer") openType("filters");
  }

  return {
    listingPage,
    currentViewMode,
    currentColumns,
    setViewMode: (m: ViewMode) => setViewModeFn(pageKey, m),
    setColumns: (n: number) => setColumnsFn(pageKey, clampColumns(n)),
    filterLocation,
    setFilterLocation,
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
