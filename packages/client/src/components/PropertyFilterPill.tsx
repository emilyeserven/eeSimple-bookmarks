import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { PresenceFilterControl, PropertyFilterBody } from "./CustomPropertyFilters";
import { FilterPill } from "./FilterPill";
import {
  withBooleanFilter,
  withChoicesFilter,
  withDateTimeFilter,
  withNumberFilter,
  withPresenceFilter,
} from "../lib/bookmarkSearch";
import { propertyHasActiveSelection, propertySelectionSummary } from "../lib/filterFacets";

interface PropertyFilterPillProps {
  property: CustomProperty;
  /** Bookmarks in view, used to derive slider bounds when the property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * One custom property rendered as a pill: the same presence toggle + type-specific control + Reset
 * button the sidebar's `Properties` section renders per-property, minus the collapsible chrome.
 * Reuses `PresenceFilterControl`/`PropertyFilterBody` directly rather than the full
 * `CustomPropertyFilters` (which also handles grouping/name-filter/category-dimming — none of which
 * applies to a single pill's popover body).
 */
export function PropertyFilterPill({
  property, bookmarks, search, onSearchChange,
}: PropertyFilterPillProps) {
  const presenceValue = search.presence?.[property.id];

  function onPropertyReset(propertyId: string) {
    onSearchChange(
      withChoicesFilter(
        withDateTimeFilter(
          withNumberFilter(
            withBooleanFilter(
              withPresenceFilter(search, propertyId, undefined),
              propertyId,
              undefined,
            ),
            propertyId,
            undefined,
          ),
          propertyId,
          undefined,
        ),
        propertyId,
        [],
      ),
    );
  }

  return (
    <FilterPill
      label={property.name}
      active={propertyHasActiveSelection(property.id, search)}
      summary={propertySelectionSummary(property, search)}
      presenceControl={(
        <PresenceFilterControl
          propertyId={property.id}
          value={presenceValue}
          onChange={(propertyId, mode) => onSearchChange(withPresenceFilter(search, propertyId, mode))}
          supportsExclude={property.type === "choices"}
        />
      )}
    >
      <PropertyFilterBody
        property={property}
        bookmarks={bookmarks}
        numberValue={search.num?.[property.id]}
        booleanValue={search.bool?.[property.id]}
        dateTimeValue={search.date?.[property.id]}
        presenceValue={presenceValue}
        choicesValue={search.choices?.[property.id]}
        onNumberFilterChange={(propertyId, range) =>
          onSearchChange(withNumberFilter(search, propertyId, range))}
        onBooleanFilterChange={(propertyId, value) =>
          onSearchChange(withBooleanFilter(search, propertyId, value))}
        onDateTimeFilterChange={(propertyId, range) =>
          onSearchChange(withDateTimeFilter(search, propertyId, range))}
        onChoicesFilterChange={(propertyId, values) =>
          onSearchChange(withChoicesFilter(search, propertyId, values))}
        onPropertyReset={onPropertyReset}
      />
    </FilterPill>
  );
}
