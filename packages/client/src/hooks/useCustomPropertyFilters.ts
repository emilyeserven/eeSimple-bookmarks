import type { NumberFilter, TagFilter } from "../lib/customPropertyFilter";
import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import {
  bookmarkMatchesFilters,

} from "../lib/customPropertyFilter";

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
  const [tagFilters, setTagFilters] = useState<Record<string, string[]>>({});

  const numberFilterList: NumberFilter[] = Object.entries(numberFilters)
    .map(([propertyId, [lo, hi]]) => ({
      propertyId,
      lo,
      hi,
    }));
  const tagFilterList: TagFilter[] = Object.entries(tagFilters)
    .map(([propertyId, allowedTagIds]) => ({
      propertyId,
      allowedTagIds,
    }));

  return {
    onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) =>
      updateRecord(setNumberFilters, propertyId, range),
    onTagFilterChange: (propertyId: string, allowedTagIds: string[] | undefined) =>
      updateRecord(setTagFilters, propertyId, allowedTagIds),
    matches: (bookmark: Pick<Bookmark, "numberValues" | "propertyTags">) =>
      bookmarkMatchesFilters(bookmark, numberFilterList, tagFilterList),
  };
}
