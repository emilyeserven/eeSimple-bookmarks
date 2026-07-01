import { ListingStatusMessages } from "./ListingStatusMessages";
import { LocationMapSection } from "./LocationMapSection";
import { PlaceTypeListItem } from "./PlaceTypeListItem";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useLocationTree } from "../hooks/useLocations";
import { usePlaceTypes } from "../hooks/usePlaceTypes";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

/** Browsable, searchable place-type listing. Creation lives in Settings → Locations → Place Types. */
export function PlaceTypesListing() {
  const {
    data: allPlaceTypes, isLoading, error,
  } = usePlaceTypes();
  const {
    data: locationTree,
  } = useLocationTree();
  useSetListingPage("place-types-listing");
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

  return (
    <div className="space-y-4">
      {locationTree && locationTree.length > 0
        ? (
          <LocationMapSection
            mapKey="place-types-listing"
            tree={locationTree}
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
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
