import type { BookmarkSort } from "../lib/bookmarkSort";
import type { ViewMode } from "../stores/uiStore";
import type { FilterLocation } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  useDisplayPreferenceSettings,
  useFilterLocation,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { DEFAULT_BOOKMARK_COLUMNS, DEFAULT_VIEW_MODE } from "../lib/bookmarkColumns";
import { withSort } from "../lib/bookmarkSearch";
import { clampColumns, useUiStore } from "../stores/uiStore";
import { usePanelControls } from "./panel/usePanelControls";

/** Listing-page display state (view mode, columns, filter location, bulk select) for the CMD+K palette. */
export function useListingPageContext() {
  const {
    t,
  } = useTranslation();
  const FILTER_LOCATION_MESSAGES: Record<FilterLocation, string> = {
    sidebar: t("Filters in sidebar"),
    drawer: t("Filters in drawer"),
    pills: t("Filters as pills"),
    hide: t("Filters hidden"),
  };

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

  const filterLocation = useFilterLocation();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const {
    openType, close, dCT,
  } = usePanelControls();

  function setFilterLocation(next: FilterLocation) {
    if (!displayData) return;
    update.mutate({
      input: {
        ...displayData,
        filterLocation: next,
      },
      successMessage: FILTER_LOCATION_MESSAGES[next],
    });
    // Pills and sidebar both live outside the drawer, so close it when leaving the drawer placement.
    if (next === "drawer") openType("filters");
    else if (dCT === "filters") close();
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
