import type { Bookmark } from "@eesimple/types";

import { bookmarkMatchesFilters } from "./customPropertyFilter";

/**
 * URL-persisted filter state shared by the search pages (the Bookmarks page and each
 * category page). `num` holds `[lo, hi]` ranges keyed by number/calculate property id;
 * `bool` holds required boolean values keyed by boolean property id. TanStack Router's
 * default search serializer round-trips these nested objects/arrays.
 */
export interface BookmarkSearch {
  /** Restrict to bookmarks whose tag is one of these ids (empty/absent = all tags). The server expands each id to its full subtree. */
  tags?: string[];
  /** Filter bookmarks by whether they have any tag ("has") or no tags ("missing"). */
  tagPresence?: "has" | "missing";
  /** Restrict to bookmarks whose category is one of these ids (empty/absent = all categories). */
  categories?: string[];
  /** Restrict to bookmarks whose media type is one of these ids (empty/absent = all media types). */
  mediaTypes?: string[];
  /** Restrict to bookmarks whose YouTube channel is one of these ids (empty/absent = all channels). */
  youtubeChannels?: string[];
  /** Filter bookmarks by whether they have a YouTube channel ("has") or none ("missing"). */
  youtubeChannelPresence?: "has" | "missing";
  /** Restrict to bookmarks whose website is one of these ids (empty/absent = all websites). */
  websites?: string[];
  /** Filter bookmarks by whether they have a website ("has") or none ("missing"). */
  websitePresence?: "has" | "missing";
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

  if (Array.isArray(search.tags)) {
    const tagIds = search.tags.filter((v): v is string => typeof v === "string");
    if (tagIds.length > 0) result.tags = tagIds;
  }

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

  if (search.youtubeChannelPresence === "has" || search.youtubeChannelPresence === "missing") {
    result.youtubeChannelPresence = search.youtubeChannelPresence;
  }

  if (Array.isArray(search.websites)) {
    const ids = search.websites.filter((v): v is string => typeof v === "string");
    if (ids.length > 0) result.websites = ids;
  }

  if (search.websitePresence === "has" || search.websitePresence === "missing") {
    result.websitePresence = search.websitePresence;
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

type SearchableBookmark = Pick<
  Bookmark,
  | "categoryId"
  | "mediaType"
  | "youtubeChannel"
  | "website"
  | "tags"
  | "numberValues"
  | "booleanValues"
  | "dateTimeValues"
>;

/** A multi-select id filter passes when it is empty or contains the bookmark's value. */
function passesIdFilter(selected: string[] | undefined, value: string | null | undefined): boolean {
  if (!selected || selected.length === 0) return true;
  return value != null && selected.includes(value);
}

/** A "has"/"missing" presence filter checks whether the dimension is present. */
function passesPresence(mode: "has" | "missing" | undefined, present: boolean): boolean {
  if (mode === "has") return present;
  if (mode === "missing") return !present;
  return true;
}

/** Every per-property presence filter must be satisfied. */
function passesPropertyPresence(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
  for (const [propertyId, mode] of Object.entries(search.presence ?? {})) {
    const hasValue
      = bookmark.numberValues.some(v => v.propertyId === propertyId)
        || bookmark.booleanValues.some(v => v.propertyId === propertyId)
        || bookmark.dateTimeValues.some(v => v.propertyId === propertyId);
    if (!passesPresence(mode, hasValue)) return false;
  }
  return true;
}

/** Whether a bookmark satisfies the number/boolean/date-time property-value ranges in `search`. */
function passesValueFilters(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
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

/** Whether a bookmark satisfies every active filter in `search`. */
export function bookmarkMatchesSearch(
  bookmark: SearchableBookmark,
  search: BookmarkSearch,
): boolean {
  return (
    passesIdFilter(search.categories, bookmark.categoryId)
    && passesIdFilter(search.mediaTypes, bookmark.mediaType?.id)
    && passesIdFilter(search.youtubeChannels, bookmark.youtubeChannel?.id)
    && passesPresence(search.youtubeChannelPresence, Boolean(bookmark.youtubeChannel))
    && passesIdFilter(search.websites, bookmark.website?.id)
    && passesPresence(search.websitePresence, Boolean(bookmark.website))
    && passesPresence(search.tagPresence, bookmark.tags.length > 0)
    && passesPropertyPresence(bookmark, search)
    && passesValueFilters(bookmark, search)
  );
}

/** Whether any filter in `search` is active (used to choose the empty-state message). */
export function hasAnyActiveFilter(search: BookmarkSearch): boolean {
  return (
    (search.tags?.length ?? 0) > 0
    || search.tagPresence !== undefined
    || (search.categories?.length ?? 0) > 0
    || (search.mediaTypes?.length ?? 0) > 0
    || (search.youtubeChannels?.length ?? 0) > 0
    || search.youtubeChannelPresence !== undefined
    || (search.websites?.length ?? 0) > 0
    || search.websitePresence !== undefined
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

/** Return a copy of `search` with the tag filter set, or cleared when `ids` is empty. */
export function withTags(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.tags;
  else next.tags = ids;
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
    if (mode === "missing") delete next.tags;
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

/**
 * Return a copy of `search` with the YouTube-channel-presence filter set or cleared.
 * Setting `"missing"` also clears any specific channel selection (selecting one contradicts "none").
 */
export function withYouTubeChannelPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.youtubeChannelPresence;
  }
  else {
    next.youtubeChannelPresence = mode;
    if (mode === "missing") delete next.youtubeChannels;
  }
  return next;
}

/** Return a copy of `search` with the website filter set, or cleared when `ids` is empty. */
export function withWebsites(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.websites;
  else next.websites = ids;
  return next;
}

/**
 * Return a copy of `search` with the website-presence filter set or cleared.
 * Setting `"missing"` also clears any specific website selection (selecting one contradicts "none").
 */
export function withWebsitePresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.websitePresence;
  }
  else {
    next.websitePresence = mode;
    if (mode === "missing") delete next.websites;
  }
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
/** Format a "<n> <singular|plural>" fragment, or `null` when the count is zero. */
function countPart(count: number, singular: string, plural: string): string | null {
  return count > 0 ? `${count} ${count === 1 ? singular : plural}` : null;
}

export function summarizeBookmarkSearch(raw: Record<string, unknown>): string {
  const search = validateBookmarkSearch(raw);
  const propCount
    = Object.keys(search.num ?? {}).length
      + Object.keys(search.bool ?? {}).length
      + Object.keys(search.date ?? {}).length
      + Object.keys(search.presence ?? {}).length;
  const parts = [
    countPart(search.categories?.length ?? 0, "category", "categories"),
    countPart(search.mediaTypes?.length ?? 0, "media type", "media types"),
    countPart(search.youtubeChannels?.length ?? 0, "channel", "channels"),
    search.youtubeChannelPresence !== undefined ? `channel: ${search.youtubeChannelPresence}` : null,
    countPart(search.websites?.length ?? 0, "website", "websites"),
    search.websitePresence !== undefined ? `website: ${search.websitePresence}` : null,
    countPart(search.tags?.length ?? 0, "tag", "tags"),
    search.tagPresence !== undefined ? `tags: ${search.tagPresence}` : null,
    countPart(propCount, "property", "properties"),
  ].filter((part): part is string => part !== null);
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
