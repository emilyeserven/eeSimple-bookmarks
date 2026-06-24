import type { Bookmark, BookmarkAuthor, SectionEntryType } from "@eesimple/types";

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
  /** Restrict to bookmarks that have a relationship of one of these type ids (empty/absent = all). */
  relationshipTypes?: string[];
  /** Restrict to bookmarks whose author list overlaps with these ids (empty/absent = all). */
  authors?: string[];
  num?: Record<string, [number, number]>;
  bool?: Record<string, boolean>;
  /** `[from, to]` date/time range bounds (canonical strings, either `null`) keyed by property id. */
  date?: Record<string, [string | null, string | null]>;
  /** Filter bookmarks by whether a property value is present or absent, keyed by property id. */
  presence?: Record<string, "has" | "missing">;
  /** Filter bookmarks by selected choices values keyed by property id; a bookmark passes if any selected value matches (OR semantics). */
  choices?: Record<string, string[]>;
  /** Filter bookmarks by whether they have any sections entries ("has") or none ("missing"). */
  sectionsPresence?: "has" | "missing";
  /** Filter bookmarks to those with at least one section entry of one of these types (OR semantics). */
  sectionTypes?: SectionEntryType[];
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

function parseChoicesRecord(raw: unknown): Record<string, string[]> {
  if (raw === null || typeof raw !== "object") return {};
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const strings = value.filter((v): v is string => typeof v === "string");
      if (strings.length > 0) result[key] = strings;
    }
  }
  return result;
}

/** Keep a value only if it is a non-empty array of strings, dropping non-string entries. */
function validStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((v): v is string => typeof v === "string");
  return ids.length > 0 ? ids : undefined;
}

/** Narrow a presence value to the `"has" | "missing"` enum, or `undefined` if malformed. */
function validPresence(value: unknown): "has" | "missing" | undefined {
  return value === "has" || value === "missing" ? value : undefined;
}

/** Keep a parsed record only if it has at least one entry (an empty record is not an active filter). */
function nonEmptyRecord<T extends Record<string, unknown>>(record: T): T | undefined {
  return Object.keys(record).length > 0 ? record : undefined;
}

const VALID_SECTION_TYPES = new Set(["url", "page", "timestamp"]);

/** Narrow an unknown value to a `SectionEntryType[]`, dropping invalid entries. */
function validSectionTypes(value: unknown): SectionEntryType[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const valid = value.filter((v): v is SectionEntryType => typeof v === "string" && VALID_SECTION_TYPES.has(v));
  return valid.length > 0 ? valid : undefined;
}

/** Narrow an unknown search record into a `BookmarkSearch`, dropping anything malformed or absent. */
export function validateBookmarkSearch(search: Record<string, unknown>): BookmarkSearch {
  const candidates: BookmarkSearch = {
    tags: validStringList(search.tags),
    tagPresence: validPresence(search.tagPresence),
    categories: validStringList(search.categories),
    mediaTypes: validStringList(search.mediaTypes),
    youtubeChannels: validStringList(search.youtubeChannels),
    youtubeChannelPresence: validPresence(search.youtubeChannelPresence),
    websites: validStringList(search.websites),
    websitePresence: validPresence(search.websitePresence),
    relationshipTypes: validStringList(search.relationshipTypes),
    authors: validStringList(search.authors),
    num: nonEmptyRecord(parseNumRecord(search.num)),
    bool: nonEmptyRecord(parseBoolRecord(search.bool)),
    date: nonEmptyRecord(parseDateRecord(search.date)),
    presence: nonEmptyRecord(parsePresenceRecord(search.presence)),
    choices: nonEmptyRecord(parseChoicesRecord(search.choices)),
    sectionsPresence: validPresence(search.sectionsPresence),
    sectionTypes: validSectionTypes(search.sectionTypes),
  };

  // Drop the keys that came back undefined so the result has no empty/absent filter entries.
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(candidates)) {
    if (value !== undefined) result[key] = value;
  }
  return result as BookmarkSearch;
}

type SearchableBookmark = Pick<
  Bookmark,
  | "categoryId"
  | "mediaType"
  | "youtubeChannel"
  | "website"
  | "tags"
  | "authors"
  | "numberValues"
  | "booleanValues"
  | "dateTimeValues"
  | "fileValues"
  | "progressValues"
  | "choicesValues"
  | "sectionsValues"
  | "relationships"
>;

/** A multi-select relationship-type filter passes when empty or the bookmark has a matching edge. */
function passesRelationshipTypeFilter(
  selected: string[] | undefined,
  bookmark: SearchableBookmark,
): boolean {
  if (!selected || selected.length === 0) return true;
  return bookmark.relationships.some(rel => selected.includes(rel.relationshipTypeId));
}

/** A multi-select author filter passes when empty or the bookmark has at least one matching author. */
function passesAuthorsFilter(selected: string[] | undefined, authors: BookmarkAuthor[]): boolean {
  if (!selected || selected.length === 0) return true;
  return authors.some(a => selected.includes(a.id));
}

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

/** Whether a bookmark passes the sections-presence filter. */
function passesSectionsPresence(bookmark: SearchableBookmark, mode: "has" | "missing" | undefined): boolean {
  if (!mode) return true;
  const hasSections = bookmark.sectionsValues.some(v => v.sections.length > 0);
  return mode === "has" ? hasSections : !hasSections;
}

/** Whether a bookmark passes the section-type filter (at least one entry of the required types). */
function passesSectionTypes(bookmark: SearchableBookmark, types: SectionEntryType[] | undefined): boolean {
  if (!types || types.length === 0) return true;
  return bookmark.sectionsValues.some(sv => sv.sections.some(e => types.includes(e.type)));
}

/** Every per-property presence filter must be satisfied. */
function passesPropertyPresence(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
  for (const [propertyId, mode] of Object.entries(search.presence ?? {})) {
    const hasValue
      = bookmark.numberValues.some(v => v.propertyId === propertyId)
        || bookmark.booleanValues.some(v => v.propertyId === propertyId)
        || bookmark.dateTimeValues.some(v => v.propertyId === propertyId)
        || bookmark.fileValues.some(v => v.propertyId === propertyId)
        || bookmark.progressValues.some(v => v.propertyId === propertyId)
        || bookmark.choicesValues.some(v => v.propertyId === propertyId && v.values.length > 0)
        || bookmark.sectionsValues.some(v => v.propertyId === propertyId && v.sections.length > 0);
    if (!passesPresence(mode, hasValue)) return false;
  }
  return true;
}

/** Every choices filter must match: a bookmark passes if any of its selected values for the property overlaps the required set. */
function passesChoicesFilters(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
  for (const [propertyId, required] of Object.entries(search.choices ?? {})) {
    if (required.length === 0) continue;
    const entry = bookmark.choicesValues.find(v => v.propertyId === propertyId);
    const bookmarkValues = entry?.values ?? [];
    if (!required.some(v => bookmarkValues.includes(v))) return false;
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
  return bookmarkMatchesFilters(bookmark, numberFilters, booleanFilters, dateTimeFilters, bookmark.progressValues);
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
    && passesRelationshipTypeFilter(search.relationshipTypes, bookmark)
    && passesAuthorsFilter(search.authors, bookmark.authors)
    && passesPresence(search.tagPresence, bookmark.tags.length > 0)
    && passesPropertyPresence(bookmark, search)
    && passesValueFilters(bookmark, search)
    && passesChoicesFilters(bookmark, search)
    && passesSectionsPresence(bookmark, search.sectionsPresence)
    && passesSectionTypes(bookmark, search.sectionTypes)
  );
}

/** A non-empty array filter. */
function hasItems(value: readonly unknown[] | undefined): boolean {
  return (value?.length ?? 0) > 0;
}

/** A record filter with at least one keyed entry. */
function hasEntries(value: Record<string, unknown> | undefined): boolean {
  return Object.keys(value ?? {}).length > 0;
}

/** Whether any filter in `search` is active (used to choose the empty-state message). */
export function hasAnyActiveFilter(search: BookmarkSearch): boolean {
  return (
    hasItems(search.tags)
    || search.tagPresence !== undefined
    || hasItems(search.categories)
    || hasItems(search.mediaTypes)
    || hasItems(search.youtubeChannels)
    || search.youtubeChannelPresence !== undefined
    || hasItems(search.websites)
    || search.websitePresence !== undefined
    || hasItems(search.relationshipTypes)
    || hasItems(search.authors)
    || hasEntries(search.num)
    || hasEntries(search.bool)
    || hasEntries(search.date)
    || hasEntries(search.presence)
    || hasEntries(search.choices)
    || search.sectionsPresence !== undefined
    || hasItems(search.sectionTypes)
  );
}

/** Stable, recursively key-sorted JSON so object/record key order doesn't affect equality. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * Whether two searches are equivalent after normalization. Both sides are run through
 * `validateBookmarkSearch` and compared via a key-sorted serialization so that the `num`/`bool`/
 * `date`/`presence` records (arbitrary key order) don't produce false negatives. Used to detect
 * which saved filter, if any, matches the currently-applied filters.
 */
export function bookmarkSearchEquals(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  return canonicalJson(validateBookmarkSearch(a)) === canonicalJson(validateBookmarkSearch(b));
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

/** Return a copy of `search` with the author filter set, or cleared when `ids` is empty. */
export function withAuthors(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.authors;
  else next.authors = ids;
  return next;
}

/** Return a copy of `search` with the relationship-type filter set, or cleared when `ids` is empty. */
export function withRelationshipTypes(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.relationshipTypes;
  else next.relationshipTypes = ids;
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

/** Return a copy of `search` with a choices filter set, or cleared when `values` is empty. */
export function withChoicesFilter(
  search: BookmarkSearch,
  propertyId: string,
  values: string[],
): BookmarkSearch {
  return {
    ...search,
    choices: patchRecord(search.choices, propertyId, values.length > 0 ? values : undefined),
  };
}

/** Return a copy of `search` with the sections-presence filter set or cleared. */
export function withSectionsPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) delete next.sectionsPresence;
  else next.sectionsPresence = mode;
  return next;
}

/** Return a copy of `search` with the section-type filter set, or cleared when `types` is empty. */
export function withSectionTypes(search: BookmarkSearch, types: SectionEntryType[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (types.length === 0) delete next.sectionTypes;
  else next.sectionTypes = types;
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
      + Object.keys(search.presence ?? {}).length
      + Object.keys(search.choices ?? {}).length;
  const parts = [
    countPart(search.categories?.length ?? 0, "category", "categories"),
    countPart(search.mediaTypes?.length ?? 0, "media type", "media types"),
    countPart(search.youtubeChannels?.length ?? 0, "channel", "channels"),
    search.youtubeChannelPresence !== undefined ? `channel: ${search.youtubeChannelPresence}` : null,
    countPart(search.websites?.length ?? 0, "website", "websites"),
    search.websitePresence !== undefined ? `website: ${search.websitePresence}` : null,
    countPart(search.relationshipTypes?.length ?? 0, "relationship type", "relationship types"),
    countPart(search.authors?.length ?? 0, "author", "authors"),
    countPart(search.tags?.length ?? 0, "tag", "tags"),
    search.tagPresence !== undefined ? `tags: ${search.tagPresence}` : null,
    countPart(propCount, "property", "properties"),
    search.sectionsPresence !== undefined ? `sections: ${search.sectionsPresence}` : null,
    search.sectionTypes && search.sectionTypes.length > 0 ? `section types: ${search.sectionTypes.join(", ")}` : null,
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
