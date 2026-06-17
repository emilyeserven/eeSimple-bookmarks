import type { BooleanFilter, NumberFilter } from "../lib/customPropertyFilter";
import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { bookmarkMatchesFilters } from "../lib/customPropertyFilter";

/** Set or clear (when `value` is undefined) a keyed entry in a record state. */
function updateRecord<V>(
  setter: React.Dispatch<React.SetStateAction<Record<string, V>>>,
  key: string,
  value: V | undefined,
) {
  setter((current) => {
    if (value === undefined) {
      const {
        [key]: _removed, ...rest
      } = current;
      return rest;
    }
    return {
      ...current,
      [key]: value,
    };
  });
}

/**
 * Owns the active custom-property filter state and exposes a `matches` predicate
 * plus change handlers for the filter controls.
 */
export function useCustomPropertyFilters() {
  // Active filters keyed by property id (absent = inactive).
  const [numberFilters, setNumberFilters] = useState<Record<string, [number, number]>>({});
  const [booleanFilters, setBooleanFilters] = useState<Record<string, boolean>>({});

  const numberFilterList: NumberFilter[] = Object.entries(numberFilters)
    .map(([propertyId, [lo, hi]]) => ({
      propertyId,
      lo,
      hi,
    }));
  const booleanFilterList: BooleanFilter[] = Object.entries(booleanFilters)
    .map(([propertyId, value]) => ({
      propertyId,
      value,
    }));

  return {
    onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) =>
      updateRecord(setNumberFilters, propertyId, range),
    onBooleanFilterChange: (propertyId: string, value: boolean | undefined) =>
      updateRecord(setBooleanFilters, propertyId, value),
    matches: (bookmark: Pick<Bookmark, "numberValues" | "booleanValues">) =>
      bookmarkMatchesFilters(bookmark, numberFilterList, booleanFilterList),
  };
}
