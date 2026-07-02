import { useCallback, useMemo, useState } from "react";

import { LocationMapSection } from "./LocationMapSection";
import { TreeListingScaffold } from "./TreeListingScaffold";

import { buildLocationTreeListingConfig } from "@/entities/location";
import { useTreeListingScaffold } from "@/hooks/useTreeListingScaffold";

/** Browsable, collapsible location taxonomy tree. Shared by the Locations taxonomy page and the Settings page. */
export function LocationsListing() {
  // Map filter: the location ids the map is focused on. Empty = show every location. Shared by the
  // overlay Filter combobox and the tree rows' per-row "Filter on map" buttons, which is why the
  // state lives here (above both the map and the scaffold) and the config is a memoized factory.
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const toggleFilterId = useCallback((id: string) => {
    setFilterIds(prev => (prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]));
  }, []);

  const config = useMemo(
    () => buildLocationTreeListingConfig({
      filterIds,
      onToggleFilter: toggleFilterId,
    }),
    [filterIds, toggleFilterId],
  );
  const state = useTreeListingScaffold(config);

  return (
    <div className="space-y-4">
      {state.tree.length > 0
        ? (
          <LocationMapSection
            mapKey="listing"
            tree={state.tree}
            showLevels
            scope={{
              kind: "main",
            }}
            filter={{
              filterIds,
              onFilterChange: setFilterIds,
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
