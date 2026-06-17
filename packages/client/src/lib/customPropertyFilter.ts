import type { Bookmark } from "@eesimple/types";

/** An active number-range filter for one number custom property. */
export interface NumberFilter {
  propertyId: string;
  lo: number;
  hi: number;
}

/** An active tiered-tags filter for one property: the selected tag and its subtree. */
export interface TagFilter {
  propertyId: string;
  allowedTagIds: string[];
}

/**
 * Whether a bookmark satisfies every active custom-property filter. A bookmark
 * lacking a value for an active property fails that filter. Pure — operates on the
 * bookmark's hydrated values so it can be unit-tested.
 */
export function bookmarkMatchesFilters(
  bookmark: Pick<Bookmark, "numberValues" | "propertyTags">,
  numberFilters: NumberFilter[],
  tagFilters: TagFilter[],
): boolean {
  for (const filter of numberFilters) {
    const entry = bookmark.numberValues.find(value => value.propertyId === filter.propertyId);
    if (!entry || entry.value < filter.lo || entry.value > filter.hi) return false;
  }

  for (const filter of tagFilters) {
    const allowed = new Set(filter.allowedTagIds);
    const matches = bookmark.propertyTags.some(
      tag => tag.propertyId === filter.propertyId && allowed.has(tag.id),
    );
    if (!matches) return false;
  }

  return true;
}
