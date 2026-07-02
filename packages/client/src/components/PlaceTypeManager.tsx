import { useCallback, useMemo, useState } from "react";

import { placeTypeKey } from "@eesimple/types";

import { ListingScaffold } from "./ListingScaffold";
import { LocationMapSection } from "./LocationMapSection";
import { useLocationTree } from "../hooks/useLocations";
import { filterTreeByPlaceType } from "../lib/locationLevels";

import { buildPlaceTypeListingConfig } from "@/entities/placeType";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable place-type listing. Creation lives in Settings → Locations → Place Types. */
export function PlaceTypesListing() {
  const {
    data: locationTree,
  } = useLocationTree();
  useSetListingPage("place-types-listing", {
    addBookmark: {},
  });

  // Map filter: which place type ids the map is focused on. Empty = show every location, matching
  // by the normalized `placeTypeKey` of each selected place type's slug against each location's own
  // (equally normalized) `placeType` string — the same correlation the middleware uses for `locationCount`.
  const [filterIds, setFilterIds] = useState<Set<string>>(new Set());
  const toggleFilterId = useCallback((id: string) => {
    setFilterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const listingConfig = useMemo(
    () => buildPlaceTypeListingConfig({
      filterIds,
      onToggleFilter: toggleFilterId,
    }),
    [filterIds, toggleFilterId],
  );
  const state = useListingScaffold(listingConfig);

  const filterKeys = new Set(
    state.items.filter(pt => filterIds.has(pt.id)).map(pt => placeTypeKey(pt.slug)),
  );
  const plottedTree = locationTree ? filterTreeByPlaceType(locationTree, filterKeys) : locationTree;

  // Levels overlay "Filter" combobox: focuses the map on chosen location(s) + descendants, same as
  // the main Locations listing (`LocationsListing`) — a separate concern from the per-row place-type
  // map filter above.
  const [locationFilterIds, setLocationFilterIds] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      {locationTree && locationTree.length > 0
        ? (
          <LocationMapSection
            mapKey="place-types-listing"
            tree={plottedTree ?? locationTree}
            showLevels
            scope={{
              kind: "main",
            }}
            filter={{
              filterIds: locationFilterIds,
              onFilterChange: setLocationFilterIds,
            }}
          />
        )
        : null}

      <ListingScaffold
        config={listingConfig}
        state={state}
      />
    </div>
  );
}
