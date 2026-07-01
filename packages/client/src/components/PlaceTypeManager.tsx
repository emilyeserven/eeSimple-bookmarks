import { useCallback, useState } from "react";

import { placeTypeKey } from "@eesimple/types";

import { ListingStatusMessages } from "./ListingStatusMessages";
import { LocationMapSection } from "./LocationMapSection";
import { PlaceTypeListItem } from "./PlaceTypeListItem";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useLocationTree } from "../hooks/useLocations";
import { usePlaceTypes } from "../hooks/usePlaceTypes";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";
import { filterTreeByPlaceType } from "../lib/locationLevels";

/** Browsable, searchable place-type listing. Creation lives in Settings → Locations → Place Types. */
export function PlaceTypesListing() {
  const {
    data: allPlaceTypes, isLoading, error,
  } = usePlaceTypes();
  const {
    data: locationTree,
  } = useLocationTree();
  useSetListingPage("place-types-listing", false, false, false, undefined, false, {
    addBookmark: {},
  });
  useRegisterHeaderSearch();

  const placeTypes = allPlaceTypes ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    placeTypes,
    (placeType, query) =>
      placeType.name.toLowerCase().includes(query) || placeType.slug.toLowerCase().includes(query),
  );
  const columns = useBookmarkColumns("place-types-listing");

  // Map filter: which place type ids the map is focused on. Empty = show every location, matching
  // by the normalized `placeTypeKey` of each selected place type's slug against each location's own
  // (equally normalized) `placeType` string — the same correlation the middleware uses for `locationCount`.
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const toggleFilterId = useCallback((id: string) => {
    setFilterIds(prev => (prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]));
  }, []);
  const filterKeys = new Set(
    placeTypes.filter(pt => filterIds.includes(pt.id)).map(pt => placeTypeKey(pt.slug)),
  );
  const plottedTree = locationTree ? filterTreeByPlaceType(locationTree, filterKeys) : locationTree;

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
          />
        )
        : null}

      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={placeTypes.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading place types…"
        entityPlural="place types"
        emptyMessage={(
          <p className="text-muted-foreground">
            No place types yet. They are seeded from your locations’ place classifications.
          </p>
        )}
      />

      {filtered.length > 0
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(placeType => (
              <PlaceTypeListItem
                key={placeType.id}
                placeType={placeType}
                filtered={filterIds.includes(placeType.id)}
                onToggleFilter={() => toggleFilterId(placeType.id)}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
