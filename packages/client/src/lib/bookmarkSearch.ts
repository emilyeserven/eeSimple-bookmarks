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
  /** Filter bookmarks by whether they have any tag ("has") or no tags ("missing"). */
  tagPresence?: "has" | "missing";
  /** Restrict to bookmarks whose category is one of these ids (empty/absent = all categories). */
  categories?: string[];
  num?: Record<string, [number, number]>;
  bool?: Record<string, boolean>;
  /** Filter bookmarks by whether a property value is present or absent, keyed by property id. */
  presence?: Record<string, "has" | "missing">;
}

/** Narrow an unknown search record into a `BookmarkSearch`, dropping anything malformed. */
export function validateBookmarkSearch(search: Record<string, unknown>): BookmarkSearch {
  const result: BookmarkSearch = {};

  if (typeof search.tag === "string") result.tag = search.tag;

  if (search.tagPresence === "has" || search.tagPresence === "missing") {
    result.tagPresence = search.tagPresence;
  }

  if (Array.isArray(search.categories)) {
    const categories = search.categories.filter((value): value is string =>
      typeof value === "string");
    if (categories.length > 0) result.categories = categories;
  }

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

  if (search.presence !== null && typeof search.presence === "object") {
    const presence: Record<string, "has" | "missing"> = {};
    for (const [key, value] of Object.entries(search.presence as Record<string, unknown>)) {
      if (value === "has" || value === "missing") presence[key] = value;
    }
    if (Object.keys(presence).length > 0) result.presence = presence;
  }

  return result;
}

/** Whether a bookmark satisfies every active filter in `search`. */
export function bookmarkMatchesSearch(
  bookmark: Pick<Bookmark, "categoryId" | "tags" | "numberValues" | "booleanValues">,
  search: BookmarkSearch,
): boolean {
  if (
    search.categories
    && search.categories.length > 0
    && !search.categories.includes(bookmark.categoryId)
  ) {
    return false;
  }

  if (search.tagPresence === "has" && bookmark.tags.length === 0) return false;
  if (search.tagPresence === "missing" && bookmark.tags.length > 0) return false;

  for (const [propertyId, mode] of Object.entries(search.presence ?? {})) {
    const hasNum = bookmark.numberValues.some(v => v.propertyId === propertyId);
    const hasBool = bookmark.booleanValues.some(v => v.propertyId === propertyId);
    const hasValue = hasNum || hasBool;
    if (mode === "has" && !hasValue) return false;
    if (mode === "missing" && hasValue) return false;
  }

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

/**
 * Return a copy of `search` with the tag-presence filter set or cleared.
 * Setting `"missing"` also clears any specific tag selection (selecting a tag contradicts "no tags").
 */
export function withTagPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.tagPresence;
  }
  else {
    next.tagPresence = mode;
    if (mode === "missing") delete next.tag;
  }
  return next;
}

/** Return a copy of `search` with the category filter set, or cleared when `ids` is empty. */
export function withCategories(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.categories;
  else next.categories = ids;
  return next;
}

/** Return a copy of `search` with a property-presence filter set or cleared. */
export function withPresenceFilter(
  search: BookmarkSearch,
  propertyId: string,
  mode: "has" | "missing" | undefined,
): BookmarkSearch {
  return {
    ...search,
    presence: patchRecord(search.presence, propertyId, mode),
  };
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
