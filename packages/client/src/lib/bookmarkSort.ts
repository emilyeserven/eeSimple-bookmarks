import type { Bookmark, CustomProperty } from "@eesimple/types";

export const BUILTIN_SORT_FIELDS = ["title", "createdAt", "updatedAt"] as const;
export type BuiltinSortField = typeof BUILTIN_SORT_FIELDS[number];
export type SortDirection = "asc" | "desc";

export interface BookmarkSortDimension {
  /** A built-in field name or a custom property ID. */
  field: BuiltinSortField | string;
  direction: SortDirection;
}

export interface BookmarkFieldSort {
  primary: BookmarkSortDimension;
  secondary?: BookmarkSortDimension;
}

/** Shuffles bookmarks in a stable pseudo-random order derived from `seed`. */
export interface BookmarkRandomSort {
  random: true;
  /** Re-rolled each time the user picks "Random" or clicks "Shuffle again". */
  seed: number;
}

export type BookmarkSort = BookmarkFieldSort | BookmarkRandomSort;

/** Custom property types whose values can be meaningfully compared for sorting. */
export const SORTABLE_PROPERTY_TYPES = [
  "number",
  "calculate",
  "ratingScale",
  "datetime",
  "text",
  "boolean",
  "choices",
] as const;

/** Returns a numeric comparator result for a single sort dimension. */
function compareOneDimension(
  a: Bookmark,
  b: Bookmark,
  dim: BookmarkSortDimension,
  properties: CustomProperty[],
): number {
  const sign = dim.direction === "asc" ? 1 : -1;

  if (dim.field === "title") {
    return sign * a.title.localeCompare(b.title, undefined, {
      sensitivity: "base",
    });
  }

  if (dim.field === "createdAt") {
    return sign * (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0);
  }

  if (dim.field === "updatedAt") {
    // Null (never-updated) always sorts last regardless of direction.
    if (a.updatedAt === null && b.updatedAt === null) return 0;
    if (a.updatedAt === null) return 1;
    if (b.updatedAt === null) return -1;
    return sign * (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0);
  }

  // Custom property — look up value by property type.
  const prop = properties.find(p => p.id === dim.field);
  if (!prop) return 0;

  const nullLast = 1; // missing values always sort last

  if (prop.type === "number" || prop.type === "calculate" || prop.type === "ratingScale") {
    const av = a.numberValues.find(v => v.propertyId === prop.id)?.value ?? null;
    const bv = b.numberValues.find(v => v.propertyId === prop.id)?.value ?? null;
    if (av === null && bv === null) return 0;
    if (av === null) return nullLast;
    if (bv === null) return -nullLast;
    return sign * (av - bv);
  }

  if (prop.type === "datetime") {
    const av = a.dateTimeValues.find(v => v.propertyId === prop.id)?.value ?? null;
    const bv = b.dateTimeValues.find(v => v.propertyId === prop.id)?.value ?? null;
    if (av === null && bv === null) return 0;
    if (av === null) return nullLast;
    if (bv === null) return -nullLast;
    return sign * (av < bv ? -1 : av > bv ? 1 : 0);
  }

  if (prop.type === "text") {
    const av = a.textValues.find(v => v.propertyId === prop.id)?.value ?? null;
    const bv = b.textValues.find(v => v.propertyId === prop.id)?.value ?? null;
    if (av === null && bv === null) return 0;
    if (av === null) return nullLast;
    if (bv === null) return -nullLast;
    return sign * av.localeCompare(bv, undefined, {
      sensitivity: "base",
    });
  }

  if (prop.type === "boolean") {
    const av = a.booleanValues.find(v => v.propertyId === prop.id)?.value ?? null;
    const bv = b.booleanValues.find(v => v.propertyId === prop.id)?.value ?? null;
    if (av === null && bv === null) return 0;
    if (av === null) return nullLast;
    if (bv === null) return -nullLast;
    // false (0) < true (1)
    return sign * ((av ? 1 : 0) - (bv ? 1 : 0));
  }

  if (prop.type === "choices") {
    // Sort by the label of the first selected choice value alphabetically.
    const firstChoice = (vals: typeof a.choicesValues) => {
      const cv = vals.find(v => v.propertyId === prop.id);
      if (!cv || cv.values.length === 0) return null;
      const item = prop.choicesItems.find(i => i.value === cv.values[0]);
      return item?.label ?? cv.values[0];
    };
    const av = firstChoice(a.choicesValues);
    const bv = firstChoice(b.choicesValues);
    if (av === null && bv === null) return 0;
    if (av === null) return nullLast;
    if (bv === null) return -nullLast;
    return sign * av.localeCompare(bv, undefined, {
      sensitivity: "base",
    });
  }

  return 0;
}

/** A deterministic 32-bit hash of `id` mixed with `seed`, used to derive a stable shuffle order. */
function seededRank(id: string, seed: number): number {
  let hash = seed | 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 2654435761);
    hash ^= hash >>> 15;
  }
  return hash >>> 0;
}

/**
 * Returns a stable sorted copy of `bookmarks` according to `sort`.
 * When `sort` is undefined the original order is preserved (server's `createdAt DESC`).
 */
export function sortBookmarks(
  bookmarks: Bookmark[],
  sort: BookmarkSort | undefined,
  properties: CustomProperty[],
): Bookmark[] {
  if (!sort) return bookmarks;
  if ("random" in sort) {
    return [...bookmarks].sort((a, b) =>
      seededRank(a.id, sort.seed) - seededRank(b.id, sort.seed));
  }
  return [...bookmarks].sort((a, b) => {
    const primary = compareOneDimension(a, b, sort.primary, properties);
    if (primary !== 0) return primary;
    if (sort.secondary) return compareOneDimension(a, b, sort.secondary, properties);
    return 0;
  });
}
