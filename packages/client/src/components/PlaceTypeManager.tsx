import { useCallback, useState } from "react";

import { placeTypeKey } from "@eesimple/types";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { LocationMapSection } from "./LocationMapSection";
import { PlaceTypeListItem } from "./PlaceTypeListItem";
import { PlaceTypeTable } from "./PlaceTypeTable";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useLocationTree } from "../hooks/useLocations";
import { useBulkDeletePlaceTypes, usePlaceTypes } from "../hooks/usePlaceTypes";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { filterTreeByPlaceType } from "../lib/locationLevels";
import { useListSelection } from "../lib/useListSelection";

/** Browsable, searchable place-type listing. Creation lives in Settings → Locations → Place Types. */
export function PlaceTypesListing() {
  const {
    data: allPlaceTypes, isLoading, error,
  } = usePlaceTypes();
  const {
    data: locationTree,
  } = useLocationTree();
  useSetListingPage("place-types-listing", {
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
  const viewMode = useViewMode("place-types-listing");

  // No built-in place types exist — every row is deletable, so all filtered ids are selectable.
  const deletableIds = filtered.map(pt => pt.id);
  const selection = useListSelection("place-types-listing", deletableIds);
  useRegisterBulkSelect("place-types-listing");
  const bulkDelete = useBulkDeletePlaceTypes();

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

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["place type", "place types"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <PlaceTypeTable
            placeTypes={filtered}
            selection={selection}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
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
                selectable
                selected={selection.isSelected(placeType.id)}
                onSelectToggle={() => selection.toggle(placeType.id)}
                inSelectionMode={selection.mode}
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
