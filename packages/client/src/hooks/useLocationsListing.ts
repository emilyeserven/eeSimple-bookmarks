import type { LocationNode } from "@eesimple/types";

import { useCallback, useState } from "react";

import { usePlaceTypeDisplayConfig } from "./useAppSettings";
import { useExpandedSet } from "./useExpandedSet";
import { useBulkDeleteLocations, useLocationTree } from "./useLocations";
import { useRegisterBulkSelect } from "./useRegisterBulkSelect";
import { useViewMode } from "../lib/bookmarkColumns";
import { sortLocationTree } from "../lib/locationSort";
import { useListSelection } from "../lib/useListSelection";
import { useUiStore } from "../stores/uiStore";

/** Flatten a location tree to its ids for selection / select-all. */
function flattenLocationIds(nodes: LocationNode[]): string[] {
  return nodes.flatMap(node => [node.id, ...flattenLocationIds(node.children)]);
}

/** Owns the tree query, expand/collapse, sort, selection, and bulk-delete wiring for the Locations listing. */
export function useLocationsListing() {
  const {
    data: tree, isLoading, error,
  } = useLocationTree();

  // Empty set means every parent is collapsed by default.
  const {
    expanded, onToggle, expandAll, expandMany, collapseAll,
  } = useExpandedSet([]);

  // Map filter: the location ids the map is focused on. Empty = show every location. Shared by the
  // overlay Filter combobox and the per-row "Filter on map" buttons.
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const toggleFilterId = useCallback((id: string) => {
    setFilterIds(prev => (prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]));
  }, []);
  const viewMode = useViewMode("locations-listing");
  const deletableIds = flattenLocationIds(tree ?? []);
  const selection = useListSelection("locations-listing", deletableIds);
  useRegisterBulkSelect("locations-listing");
  const bulkDelete = useBulkDeleteLocations();

  const sortMode = useUiStore(state => state.locationSortMode);
  const setSortMode = useUiStore(state => state.setLocationSortMode);
  const displayConfig = usePlaceTypeDisplayConfig();
  const sortedTree = sortLocationTree(tree ?? [], sortMode, displayConfig);

  return {
    tree,
    isLoading,
    error,
    expanded,
    onToggle,
    expandAll,
    expandMany,
    collapseAll,
    viewMode,
    deletableIds,
    selection,
    bulkDelete,
    sortMode,
    setSortMode,
    sortedTree,
    filterIds,
    setFilterIds,
    toggleFilterId,
  };
}
