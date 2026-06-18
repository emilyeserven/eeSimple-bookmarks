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
 * An active date/time range filter for one property. Bounds are the value's canonical string
 * encoding and compared lexicographically (correct for those encodings); either may be `null`.
 */
export interface DateTimeFilter {
  propertyId: string;
  from: string | null;
  to: string | null;
}

/**
 * Whether a bookmark satisfies every active custom-property filter. A bookmark
 * lacking a value for an active property fails that filter. Pure — operates on the
 * bookmark's hydrated values so it can be unit-tested.
 */
export function bookmarkMatchesFilters(
  bookmark: Pick<Bookmark, "numberValues" | "booleanValues" | "dateTimeValues">,
  numberFilters: NumberFilter[],
  booleanFilters: BooleanFilter[],
  dateTimeFilters: DateTimeFilter[] = [],
): boolean {
  for (const filter of numberFilters) {
    const entry = bookmark.numberValues.find(value => value.propertyId === filter.propertyId);
    if (!entry || entry.value < filter.lo || entry.value > filter.hi) return false;
  }

  for (const filter of booleanFilters) {
    const entry = bookmark.booleanValues.find(value => value.propertyId === filter.propertyId);
    if (!entry || entry.value !== filter.value) return false;
  }

  for (const filter of dateTimeFilters) {
    const entry = bookmark.dateTimeValues.find(value => value.propertyId === filter.propertyId);
    if (!entry) return false;
    if (filter.from !== null && entry.value < filter.from) return false;
    if (filter.to !== null && entry.value > filter.to) return false;
  }

  return true;
}
