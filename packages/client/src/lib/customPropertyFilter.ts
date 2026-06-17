import type { Bookmark } from "@eesimple/types";

/** An active number-range filter for one number/calculate custom property. */
export interface NumberFilter {
  propertyId: string;
  lo: number;
  hi: number;
}

/** An active boolean filter for one property: require the value to equal `value`. */
export interface BooleanFilter {
  propertyId: string;
  value: boolean;
}

/**
 * Whether a bookmark satisfies every active custom-property filter. A bookmark
 * lacking a value for an active property fails that filter. Pure — operates on the
 * bookmark's hydrated values so it can be unit-tested.
 */
export function bookmarkMatchesFilters(
  bookmark: Pick<Bookmark, "numberValues" | "booleanValues">,
  numberFilters: NumberFilter[],
  booleanFilters: BooleanFilter[],
): boolean {
  for (const filter of numberFilters) {
    const entry = bookmark.numberValues.find(value => value.propertyId === filter.propertyId);
    if (!entry || entry.value < filter.lo || entry.value > filter.hi) return false;
  }

  for (const filter of booleanFilters) {
    const entry = bookmark.booleanValues.find(value => value.propertyId === filter.propertyId);
    if (!entry || entry.value !== filter.value) return false;
  }

  return true;
}
