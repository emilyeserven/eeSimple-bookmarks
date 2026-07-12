import { useCallback, useMemo, useState } from "react";

import { LocationMapSection } from "./LocationMapSection";
import { TreeListingScaffold } from "./TreeListingScaffold";
import { buildFocusedMapTree } from "../lib/locationMainMap";

import { buildLocationTreeListingConfig } from "@/entities/location";
import { useTreeListingScaffold } from "@/hooks/useTreeListingScaffold";

/** Toggle an id into/out of a string-array set (per-row map-focus buttons). */
function toggleInArray(prev: string[], id: string): string[] {
  return prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id];
}

/** Browsable, collapsible location taxonomy tree. Shared by the Locations taxonomy page and the Settings page. */
export function LocationsListing() {
  // Per-row map-focus state, owned here (above both the map and the scaffold): the "item" set is the
  // location ids the map is focused on (node + descendants, also driven by the overlay Filter
  // combobox); the "chain" set additionally plots each node's ancestor spine. Empty/empty = show the
  // whole (hidden-pruned) tree. See `lib/locationMainMap.ts`.
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [chainFilterIds, setChainFilterIds] = useState<string[]>([]);
  const toggleFilterId = useCallback((id: string) => {
    setFilterIds(prev => toggleInArray(prev, id));
  }, []);
  const toggleChainFilterId = useCallback((id: string) => {
    setChainFilterIds(prev => toggleInArray(prev, id));
  }, []);

  const config = useMemo(
    () => buildLocationTreeListingConfig({
      filterIds,
      onToggleFilter: toggleFilterId,
      chainFilterIds,
      onToggleChainFilter: toggleChainFilterId,
    }),
    [filterIds, toggleFilterId, chainFilterIds, toggleChainFilterId],
  );
  const state = useTreeListingScaffold(config);

  // The map plots the hidden-pruned tree, narrowed to the focused rows' union; the card scaffold below
  // keeps the full `state.tree` (a hidden location still lists so it can be un-hidden).
  const mapTree = useMemo(
    () => buildFocusedMapTree(state.tree, {
      itemFocusIds: filterIds,
      chainFocusIds: chainFilterIds,
    }),
    [state.tree, filterIds, chainFilterIds],
  );

  return (
    <div className="space-y-4">
      {state.tree.length > 0
        ? (
          <LocationMapSection
            mapKey="listing"
            tree={mapTree}
            showLevels
            scope={{
              kind: "main",
            }}
            filter={{
              filterIds,
              onFilterChange: setFilterIds,
              tree: state.tree,
            }}
          />
        )
        : null}

      <TreeListingScaffold
        config={config}
        state={state}
      />
    </div>
  );
}
