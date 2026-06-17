import type { Bookmark } from "@eesimple/types";

import { bookmarkMatchesFilters } from "./customPropertyFilter";

/**
 * URL-persisted filter state shared by the search pages (the Bookmarks page and each
 * category page). `num` holds `[lo, hi]` ranges keyed by number/calculate property id;
 * `bool` holds required boolean values keyed by boolean property id. TanStack Router's
 * default search serializer round-trips these nested objects/arrays.
 */
export interface BookmarkSearch {
  tag?: string;
  num?: Record<string, [number, number]>;
  bool?: Record<string, boolean>;
}

/** Narrow an unknown search record into a `BookmarkSearch`, dropping anything malformed. */
export function validateBookmarkSearch(search: Record<string, unknown>): BookmarkSearch {
  const result: BookmarkSearch = {};

  if (typeof search.tag === "string") result.tag = search.tag;

  if (search.num !== null && typeof search.num === "object") {
    const num: Record<string, [number, number]> = {};
    for (const [key, value] of Object.entries(search.num as Record<string, unknown>)) {
      if (
        Array.isArray(value)
        && value.length === 2
        && typeof value[0] === "number"
        && typeof value[1] === "number"
      ) {
        num[key] = [value[0], value[1]];
      }
    }
    if (Object.keys(num).length > 0) result.num = num;
  }

  if (search.bool !== null && typeof search.bool === "object") {
    const bool: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(search.bool as Record<string, unknown>)) {
      if (typeof value === "boolean") bool[key] = value;
    }
    if (Object.keys(bool).length > 0) result.bool = bool;
  }

  return result;
}

/** Whether a bookmark satisfies every active custom-property filter in `search`. */
export function bookmarkMatchesSearch(
  bookmark: Pick<Bookmark, "numberValues" | "booleanValues">,
  search: BookmarkSearch,
): boolean {
  const numberFilters = Object.entries(search.num ?? {}).map(([propertyId, [lo, hi]]) => ({
    propertyId,
    lo,
    hi,
  }));
  const booleanFilters = Object.entries(search.bool ?? {}).map(([propertyId, value]) => ({
    propertyId,
    value,
  }));
  return bookmarkMatchesFilters(bookmark, numberFilters, booleanFilters);
}

/** Set or clear (when `value` is undefined) a keyed entry, returning a new record or undefined. */
function patchRecord<V>(
  current: Record<string, V> | undefined,
  key: string,
  value: V | undefined,
): Record<string, V> | undefined {
  if (value === undefined) {
    const {
      [key]: _removed, ...rest
    } = current ?? {};
    return Object.keys(rest).length > 0 ? rest : undefined;
  }
  return {
    ...current,
    [key]: value,
  };
}

/** Return a copy of `search` with the tag set, or cleared when `tag` is undefined. */
export function withTag(search: BookmarkSearch, tag: string | undefined): BookmarkSearch {
  const next = {
    ...search,
  };
  if (tag === undefined) delete next.tag;
  else next.tag = tag;
  return next;
}

/** Return a copy of `search` with a number-range filter set or cleared. */
export function withNumberFilter(
  search: BookmarkSearch,
  propertyId: string,
  range: [number, number] | undefined,
): BookmarkSearch {
  return {
    ...search,
    num: patchRecord(search.num, propertyId, range),
  };
}

/** Return a copy of `search` with a boolean filter set or cleared. */
export function withBooleanFilter(
  search: BookmarkSearch,
  propertyId: string,
  value: boolean | undefined,
): BookmarkSearch {
  return {
    ...search,
    bool: patchRecord(search.bool, propertyId, value),
  };
}
