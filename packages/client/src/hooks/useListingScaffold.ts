import type { EntityListingConfig } from "../entities/types";

import { useState } from "react";

import { useHeaderSearchFilter } from "./useHeaderSearchFilter";
import { useRegisterBulkSelect } from "./useRegisterBulkSelect";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/**
 * The wiring behind a `ListingScaffold`: header search, columns/view-mode, filtering, and
 * bulk-select state for one flat-entity listing. Split from the render so a page can still branch
 * on the derived state (e.g. a create-modal open flag) without re-running the hooks.
 *
 * Covers the flat listing shape — flat + search + bulk + table/card toggle (see
 * `EntityListingConfig`). Tree taxonomies (Tags, Media Types, Locations) use the sibling
 * `useTreeListingScaffold`; Bookmarks and bespoke listings (Card Display Rules) stay outside both.
 *
 * `config.externalFilter` (page-owned facet state, e.g. Autofill's sidebar) is applied before the
 * header-search filter, so the "N of M" counts keep M = all items.
 */
export function useListingScaffold<E extends { id: string }>(config: EntityListingConfig<E>) {
  const {
    data, isLoading, error,
  } = config.useItems();
  const columns = useBookmarkColumns(config.pageKey);
  const viewMode = useViewMode(config.pageKey);

  const items = data ?? [];
  const externallyFiltered = config.externalFilter ? items.filter(config.externalFilter) : items;
  const {
    rawQuery, hasQuery, filtered: textFiltered,
  } = useHeaderSearchFilter(externallyFiltered, config.matches);

  const [secondaryFilterValue, setSecondaryFilterValue] = useState<string | null>(null);
  const {
    secondaryFilter,
  } = config;
  const preFacet = secondaryFilter
    ? textFiltered.filter(item => secondaryFilter.matches(item, secondaryFilterValue))
    : textFiltered;

  // Extra hook-based facet filter (Websites' Category/Media-Type/Built-in/Has-bookmarks). Applied
  // before sorting so it reduces the counts + bulk-select set; sorting never changes the counts.
  const filtered = config.useExtraFilter ? config.useExtraFilter(preFacet) : preFacet;
  const sorted = config.useSortedItems ? config.useSortedItems(filtered) : filtered;
  // Entity-agnostic proxy for "a facet is narrowing the list" — lets ListingStatusMessages surface the
  // "Showing X of Y" summary + generic no-match wording when a facet (not a text query) is active.
  const facetActive = config.useExtraFilter != null && filtered.length !== preFacet.length;

  const deletableIds = (config.deletableIds ?? (all => all.map(item => item.id)))(filtered);
  const selection = useListSelection(config.pageKey, deletableIds);
  useRegisterBulkSelect(config.pageKey);
  const bulkDelete = config.useBulkDelete ? config.useBulkDelete() : null;

  return {
    items,
    isLoading,
    error,
    columns,
    viewMode,
    rawQuery,
    hasQuery,
    filtered,
    sorted,
    facetActive,
    deletableIds,
    selection,
    bulkDelete,
    secondaryFilterValue,
    setSecondaryFilterValue,
  };
}

export type ListingScaffoldState<E extends { id: string }> = ReturnType<typeof useListingScaffold<E>>;
