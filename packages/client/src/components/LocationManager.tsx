import { useCallback, useMemo, useState } from "react";

import { LocationMapSection } from "./LocationMapSection";
import { TreeListingScaffold } from "./TreeListingScaffold";
import { buildFocusedMapTree, isLocationHidden } from "../lib/locationMainMap";
import { flattenTree } from "../lib/tagTree";

import { buildLocationTreeListingConfig } from "@/entities/location";
import { useTreeListingScaffold } from "@/hooks/useTreeListingScaffold";

/** Toggle an id into/out of a string-array set (the per-row "Focus on Map" buttons). */
function toggleInArray(prev: string[], id: string): string[] {
  return prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id];
}

/** Browsable, collapsible location taxonomy tree. Shared by the Locations taxonomy page and the Settings page. */
export function LocationsListing() {
  // Per-row "Focus on Map" state: the location ids the map is focused on (node + descendants, also
  // driven by the overlay Filter combobox). Empty = show the whole (visible) tree.
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const toggleFilterId = useCallback((id: string) => {
    setFilterIds(prev => toggleInArray(prev, id));
  }, []);

  // Per-row eye-toggle state: a *session* map-visibility override per location, keyed by id. Absent =
  // fall back to the location's persisted `hiddenOnMainMap` setting (see `isLocationHidden`). This is
  // component state (not uiStore), so it resets on every page reload — the setting is the durable
  // default it starts from.
  const [hiddenOverrides, setHiddenOverrides] = useState<Record<string, boolean>>({});
  const toggleVisibility = useCallback((id: string, currentlyHidden: boolean) => {
    setHiddenOverrides(prev => ({
      ...prev,
      [id]: !currentlyHidden,
    }));
  }, []);

  const config = useMemo(
    () => buildLocationTreeListingConfig({
      filterIds,
      onToggleFilter: toggleFilterId,
      hiddenOverrides,
      onToggleVisibility: toggleVisibility,
    }),
    [filterIds, toggleFilterId, hiddenOverrides, toggleVisibility],
  );
  const state = useTreeListingScaffold(config);

  // The ids of every location currently hidden from the map (session override, else the setting) — used
  // only for the map plot; the listing row derives its own from `hiddenOverrides`.
  const hiddenIds = useMemo(
    () => new Set(
      flattenTree(state.tree).filter(f => isLocationHidden(f.node, hiddenOverrides)).map(f => f.node.id),
    ),
    [state.tree, hiddenOverrides],
  );

  // The map plots the tree minus hidden subtrees, then narrowed to the focused rows' union; the card
  // scaffold below keeps the full `state.tree` (a hidden location still lists so it can be un-hidden).
  const mapTree = useMemo(
    () => buildFocusedMapTree(state.tree, {
      itemFocusIds: filterIds,
      hiddenIds,
    }),
    [state.tree, filterIds, hiddenIds],
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
