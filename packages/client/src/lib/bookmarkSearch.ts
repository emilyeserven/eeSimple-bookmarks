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
  /** Restrict to bookmarks whose media type is one of these ids (empty/absent = all media types). */
  mediaTypes?: string[];
  /** Restrict to bookmarks whose YouTube channel is one of these ids (empty/absent = all channels). */
  youtubeChannels?: string[];
  num?: Record<string, [number, number]>;
  bool?: Record<string, boolean>;
  /** `[from, to]` date/time range bounds (canonical strings, either `null`) keyed by property id. */
  date?: Record<string, [string | null, string | null]>;
  /** Filter bookmarks by whether a property value is present or absent, keyed by property id. */
  presence?: Record<string, "has" | "missing">;
}

function parseNumRecord(raw: unknown): Record<string, [number, number]> {
  if (raw === null || typeof raw !== "object") return {};
  const result: Record<string, [number, number]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (
      Array.isArray(value)
      && value.length === 2
      && typeof value[0] === "number"
      && typeof value[1] === "number"
    ) result[key] = [value[0], value[1]];
  }
  return result;
}

function parseBoolRecord(raw: unknown): Record<string, boolean> {
  if (raw === null || typeof raw !== "object") return {};
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>))
    if (typeof value === "boolean") result[key] = value;
  return result;
}

function parsePresenceRecord(raw: unknown): Record<string, "has" | "missing"> {
  if (raw === null || typeof raw !== "object") return {};
  const result: Record<string, "has" | "missing"> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>))
    if (value === "has" || value === "missing") result[key] = value;
  return result;
}

function parseDateRecord(raw: unknown): Record<string, [string | null, string | null]> {
  if (raw === null || typeof raw !== "object") return {};
  const result: Record<string, [string | null, string | null]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (
      Array.isArray(value)
      && value.length === 2
      && (typeof value[0] === "string" || value[0] === null)
      && (typeof value[1] === "string" || value[1] === null)
      // Drop an all-null entry: it's not an active filter.
      && (value[0] !== null || value[1] !== null)
    ) result[key] = [value[0], value[1]];
  }
  return result;
}

/** Narrow an unknown search record into a `BookmarkSearch`, dropping anything malformed. */
export function validateBookmarkSearch(search: Record<string, unknown>): BookmarkSearch {
  const result: BookmarkSearch = {};

  if (typeof search.tag === "string") result.tag = search.tag;

  if (search.tagPresence === "has" || search.tagPresence === "missing") {
    result.tagPresence = search.tagPresence;
  }

  if (Array.isArray(search.categories)) {
    const cats = search.categories.filter((v): v is string => typeof v === "string");
    if (cats.length > 0) result.categories = cats;
  }

  if (Array.isArray(search.mediaTypes)) {
    const ids = search.mediaTypes.filter((v): v is string => typeof v === "string");
    if (ids.length > 0) result.mediaTypes = ids;
  }

  if (Array.isArray(search.youtubeChannels)) {
    const ids = search.youtubeChannels.filter((v): v is string => typeof v === "string");
    if (ids.length > 0) result.youtubeChannels = ids;
  }

  const num = parseNumRecord(search.num);
  if (Object.keys(num).length > 0) result.num = num;

  const bool = parseBoolRecord(search.bool);
  if (Object.keys(bool).length > 0) result.bool = bool;

  const date = parseDateRecord(search.date);
  if (Object.keys(date).length > 0) result.date = date;

  const presence = parsePresenceRecord(search.presence);
  if (Object.keys(presence).length > 0) result.presence = presence;

  return result;
}

/** Whether a bookmark satisfies every active filter in `search`. */
export function bookmarkMatchesSearch(
  bookmark: Pick<
    Bookmark,
    | "categoryId"
    | "mediaType"
    | "youtubeChannel"
    | "tags"
    | "numberValues"
    | "booleanValues"
    | "dateTimeValues"
  >,
  search: BookmarkSearch,
): boolean {
  if (
    search.categories
    && search.categories.length > 0
    && !search.categories.includes(bookmark.categoryId)
  ) {
    return false;
  }

  if (
    search.mediaTypes
    && search.mediaTypes.length > 0
    && !(bookmark.mediaType && search.mediaTypes.includes(bookmark.mediaType.id))
  ) {
    return false;
  }

  if (
    search.youtubeChannels
    && search.youtubeChannels.length > 0
    && !(bookmark.youtubeChannel && search.youtubeChannels.includes(bookmark.youtubeChannel.id))
  ) {
    return false;
  }

  if (search.tagPresence === "has" && bookmark.tags.length === 0) return false;
  if (search.tagPresence === "missing" && bookmark.tags.length > 0) return false;

  for (const [propertyId, mode] of Object.entries(search.presence ?? {})) {
    const hasNum = bookmark.numberValues.some(v => v.propertyId === propertyId);
    const hasBool = bookmark.booleanValues.some(v => v.propertyId === propertyId);
    const hasDate = bookmark.dateTimeValues.some(v => v.propertyId === propertyId);
    const hasValue = hasNum || hasBool || hasDate;
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
  const dateTimeFilters = Object.entries(search.date ?? {}).map(([propertyId, [from, to]]) => ({
    propertyId,
    from,
    to,
  }));
  return bookmarkMatchesFilters(bookmark, numberFilters, booleanFilters, dateTimeFilters);
}

/** Whether any filter in `search` is active (used to choose the empty-state message). */
export function hasAnyActiveFilter(search: BookmarkSearch): boolean {
  return (
    search.tag !== undefined
    || search.tagPresence !== undefined
    || (search.categories?.length ?? 0) > 0
    || (search.mediaTypes?.length ?? 0) > 0
    || (search.youtubeChannels?.length ?? 0) > 0
    || Object.keys(search.num ?? {}).length > 0
    || Object.keys(search.bool ?? {}).length > 0
    || Object.keys(search.date ?? {}).length > 0
    || Object.keys(search.presence ?? {}).length > 0
  );
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

/** Return a copy of `search` with the media-type filter set, or cleared when `ids` is empty. */
export function withMediaTypes(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.mediaTypes;
  else next.mediaTypes = ids;
  return next;
}

/** Return a copy of `search` with the YouTube-channel filter set, or cleared when `ids` is empty. */
export function withYouTubeChannels(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.youtubeChannels;
  else next.youtubeChannels = ids;
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

/**
 * Return a human-readable summary of the active filters in a raw stored filter blob
 * (e.g. "2 categories · 1 tag · 1 property"). Accepts `Record<string, unknown>` so it can be
 * called on the JSONB blob from the API without a cast at the call site.
 */
export function summarizeBookmarkSearch(raw: Record<string, unknown>): string {
  const search = validateBookmarkSearch(raw);
  const parts: string[] = [];
  const categoryCount = search.categories?.length ?? 0;
  if (categoryCount > 0) parts.push(`${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`);
  const mediaTypeCount = search.mediaTypes?.length ?? 0;
  if (mediaTypeCount > 0) parts.push(`${mediaTypeCount} media ${mediaTypeCount === 1 ? "type" : "types"}`);
  const channelCount = search.youtubeChannels?.length ?? 0;
  if (channelCount > 0) parts.push(`${channelCount} ${channelCount === 1 ? "channel" : "channels"}`);
  if (search.tag !== undefined) parts.push("1 tag");
  if (search.tagPresence !== undefined) parts.push(`tags: ${search.tagPresence}`);
  const propCount
    = Object.keys(search.num ?? {}).length
      + Object.keys(search.bool ?? {}).length
      + Object.keys(search.date ?? {}).length
      + Object.keys(search.presence ?? {}).length;
  if (propCount > 0) parts.push(`${propCount} ${propCount === 1 ? "property" : "properties"}`);
  return parts.join(" · ") || "No filters";
}

/**
 * Return a copy of `search` with a date/time range filter set or cleared. An all-null range
 * (both bounds empty) clears the filter rather than persisting an inactive entry.
 */
export function withDateTimeFilter(
  search: BookmarkSearch,
  propertyId: string,
  range: [string | null, string | null] | undefined,
): BookmarkSearch {
  const active = range && (range[0] !== null || range[1] !== null) ? range : undefined;
  return {
    ...search,
    date: patchRecord(search.date, propertyId, active),
  };
}
