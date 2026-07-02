import type { EntityListingConfig } from "../entities/types";

import { useHeaderSearchFilter } from "./useHeaderSearchFilter";
import { useRegisterBulkSelect } from "./useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "./useRegisterHeaderSearch";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/**
 * The wiring behind a `ListingScaffold`: header search, columns/view-mode, filtering, and
 * bulk-select state for one flat-entity listing. Split from the render so a page can still branch
 * on the derived state (e.g. a create-modal open flag) without re-running the hooks.
 *
 * Covers listing shape 1 only — flat + search + bulk + table/card toggle (see `EntityListingConfig`).
 * Tree entities (Tags, Media Types, Locations) and Bookmarks are not scaffold-eligible: they render
 * their own bespoke listings and never construct an `EntityListingConfig`.
 */
export function useListingScaffold<E extends { id: string }>(config: EntityListingConfig<E>) {
  const {
    data, isLoading, error,
  } = config.useItems();
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns(config.pageKey);
  const viewMode = useViewMode(config.pageKey);

  const items = data ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(items, config.matches);

  const deletableIds = (config.deletableIds ?? (all => all.map(item => item.id)))(filtered);
  const selection = useListSelection(config.pageKey, deletableIds);
  useRegisterBulkSelect(config.pageKey);
  const bulkDelete = config.useBulkDelete();

  return {
    items,
    isLoading,
    error,
    columns,
    viewMode,
    rawQuery,
    hasQuery,
    filtered,
    deletableIds,
    selection,
    bulkDelete,
  };
}

export type ListingScaffoldState<E extends { id: string }> = ReturnType<typeof useListingScaffold<E>>;
