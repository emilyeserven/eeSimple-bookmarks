import type { BookmarkSort, BookmarkSortDimension, BuiltinSortField, SortDirection } from "./bookmarkSort";
import type { Bookmark, BookmarkPerson, BookmarkLocation, BookmarkTag, SectionEntryType } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";

import { bookmarkMatchesFilters } from "./customPropertyFilter";

/**
 * URL-persisted filter state shared by the search pages (the Bookmarks page and each
 * category page). `num` holds `[lo, hi]` ranges keyed by number/calculate property id;
 * `bool` holds required boolean values keyed by boolean property id. TanStack Router's
 * default search serializer round-trips these nested objects/arrays.
 */
export interface BookmarkSearch {
  /**
   * Restrict to bookmarks whose tag is one of these ids (empty/absent = all tags). The server
   * expands each id to its full subtree for inclusion; exclusion ("exclude" mode) is client-side
   * with exact matching only (no subtree expansion).
   */
  tags?: string[];
  /** Filter bookmarks by tag: "has" = has any tag, "missing" = no tags, "exclude" = does not have the selected tags. */
  tagPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose category is one of these ids (empty/absent = all categories). */
  categories?: string[];
  /** Restrict to bookmarks whose media type is one of these ids (empty/absent = all media types). */
  mediaTypes?: string[];
  /** Restrict to bookmarks whose YouTube channel is one of these ids (empty/absent = all channels). */
  youtubeChannels?: string[];
  /** Filter bookmarks by YouTube channel: "has" = has any, "missing" = none, "exclude" = does not have the selected channels. */
  youtubeChannelPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose website is one of these ids (empty/absent = all websites). */
  websites?: string[];
  /** Filter bookmarks by website: "has" = has any, "missing" = none, "exclude" = does not have the selected websites. */
  websitePresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks that have a relationship of one of these type ids (empty/absent = all). */
  relationshipTypes?: string[];
  /** Restrict to bookmarks with a language usage whose language is one of these ids (empty/absent = all). */
  languageUsageLanguages?: string[];
  /** Restrict to bookmarks with a language usage whose usage level is one of these ids (empty/absent = all). */
  languageUsageLevels?: string[];
  /**
   * Restrict to bookmarks with at least one location whose place type is one of these normalized
   * slugs (empty/absent = all place types). Matched against `location.placeType` via
   * {@link placeTypeKey} — a bookmark can carry several locations, so this is an "any match" filter
   * like tags, not a 1:1 id comparison.
   */
  placeTypes?: string[];
  /** Filter bookmarks by place type: "has" = has any location with a place type, "missing" = none, "exclude" = does not have the selected place types. */
  placeTypePresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose person list overlaps with these ids (empty/absent = all). */
  people?: string[];
  num?: Record<string, [number, number]>;
  bool?: Record<string, boolean>;
  /** `[from, to]` date/time range bounds (canonical strings, either `null`) keyed by property id. */
  date?: Record<string, [string | null, string | null]>;
  /** Filter bookmarks by property value presence: "has" = has a value, "missing" = no value, "exclude" = does not have the selected choices values (choices properties only). */
  presence?: Record<string, "has" | "missing" | "exclude">;
  /** Filter bookmarks by selected choices values keyed by property id. In default (include) mode a bookmark passes if any selected value matches; in "exclude" presence mode a bookmark passes if it has none of the selected values. */
  choices?: Record<string, string[]>;
  /** Filter bookmarks by whether they have any sections entries ("has"), none ("missing"), or do not have the selected section types ("exclude"). */
  sectionsPresence?: "has" | "missing" | "exclude";
  /** Filter bookmarks to those with at least one section entry of one of these types (OR semantics). In "exclude" sectionsPresence mode, bookmarks must have none of these types. */
  sectionTypes?: SectionEntryType[];
  /** Active sort order (primary + optional secondary dimension, or a random shuffle). Absent = server's default `createdAt DESC` order. */
  sort?: BookmarkSort;
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

function parsePresenceRecord(raw: unknown): Record<string, "has" | "missing" | "exclude"> {
  if (raw === null || typeof raw !== "object") return {};
  const result: Record<string, "has" | "missing" | "exclude"> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>))
    if (value === "has" || value === "missing" || value === "exclude") result[key] = value;
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

/** Narrow a presence value to the `"has" | "missing" | "exclude"` enum, or `undefined` if malformed. */
function validPresence(value: unknown): "has" | "missing" | "exclude" | undefined {
  return value === "has" || value === "missing" || value === "exclude" ? value : undefined;
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

function validSortDirection(value: unknown): SortDirection | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

/** Narrow an unknown value to a `BookmarkSortDimension` (a built-in field name or a custom property id, plus a direction). */
function validSortDimension(value: unknown): BookmarkSortDimension | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const {
    field, direction,
  } = value as Record<string, unknown>;
  const dir = validSortDirection(direction);
  if (typeof field !== "string" || field === "" || !dir) return undefined;
  return {
    field,
    direction: dir,
  };
}

/** Narrow an unknown value to a `BookmarkSort`, dropping anything malformed. */
function validSort(value: unknown): BookmarkSort | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (raw.random === true) {
    return typeof raw.seed === "number"
      ? {
        random: true,
        seed: raw.seed,
      }
      : undefined;
  }
  const primary = validSortDimension(raw.primary);
  if (!primary) return undefined;
  const secondary = validSortDimension(raw.secondary);
  return secondary
    ? {
      primary,
      secondary,
    }
    : {
      primary,
    };
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
    languageUsageLanguages: validStringList(search.languageUsageLanguages),
    languageUsageLevels: validStringList(search.languageUsageLevels),
    people: validStringList(search.people),
    placeTypes: validStringList(search.placeTypes),
    placeTypePresence: validPresence(search.placeTypePresence),
    num: nonEmptyRecord(parseNumRecord(search.num)),
    bool: nonEmptyRecord(parseBoolRecord(search.bool)),
    date: nonEmptyRecord(parseDateRecord(search.date)),
    presence: nonEmptyRecord(parsePresenceRecord(search.presence)),
    choices: nonEmptyRecord(parseChoicesRecord(search.choices)),
    sectionsPresence: validPresence(search.sectionsPresence),
    sectionTypes: validSectionTypes(search.sectionTypes),
    sort: validSort(search.sort),
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
  | "locations"
  | "people"
  | "numberValues"
  | "booleanValues"
  | "dateTimeValues"
  | "fileValues"
  | "progressValues"
  | "choicesValues"
  | "sectionsValues"
  | "relationships"
  | "languageUsages"
>;

/** A multi-select relationship-type filter passes when empty or the bookmark has a matching edge. */
function passesRelationshipTypeFilter(
  selected: string[] | undefined,
  bookmark: SearchableBookmark,
): boolean {
  if (!selected || selected.length === 0) return true;
  return bookmark.relationships.some(rel => selected.includes(rel.relationshipTypeId));
}

/**
 * The language-usage facets pass when both are empty, or when a *single* association row satisfies
 * both non-empty constraints (a language-only or level-only filter matches on that one axis).
 */
function passesLanguageUsagesFilter(
  languages: string[] | undefined,
  levels: string[] | undefined,
  bookmark: SearchableBookmark,
): boolean {
  const hasLang = languages !== undefined && languages.length > 0;
  const hasLevel = levels !== undefined && levels.length > 0;
  if (!hasLang && !hasLevel) return true;
  return bookmark.languageUsages.some(usage =>
    (!hasLang || languages.includes(usage.language.id))
    && (!hasLevel || levels.includes(usage.level.id)));
}

/** A multi-select person filter passes when empty or the bookmark has at least one matching person. */
function passesPeopleFilter(selected: string[] | undefined, people: BookmarkPerson[]): boolean {
  if (!selected || selected.length === 0) return true;
  return people.some(a => selected.includes(a.id));
}

/** A multi-select id filter passes when it is empty or contains the bookmark's value. */
function passesIdFilter(selected: string[] | undefined, value: string | null | undefined): boolean {
  if (!selected || selected.length === 0) return true;
  return value != null && selected.includes(value);
}

/** An exclusion id filter passes when empty (no filter) or the bookmark's value is NOT in the list. A null/absent value always passes (it's not excluded). */
function passesIdFilterExclude(selected: string[] | undefined, value: string | null | undefined): boolean {
  if (!selected || selected.length === 0) return true;
  if (value == null) return true;
  return !selected.includes(value);
}

/** True when none of the bookmark's tags appear in the excluded-ids list. */
function passesTagsExclusion(selected: string[] | undefined, bookmarkTags: BookmarkTag[]): boolean {
  if (!selected || selected.length === 0) return true;
  return !bookmarkTags.some(tag => selected.includes(tag.id));
}

/** The normalized, non-blank place-type keys carried by a bookmark's locations (deduped). */
function bookmarkPlaceTypeKeys(bookmarkLocations: BookmarkLocation[]): string[] {
  const keys = bookmarkLocations.map(loc => placeTypeKey(loc.placeType)).filter(key => key !== "");
  return Array.from(new Set(keys));
}

/** A multi-select place-type filter passes when empty or the bookmark has a location with a matching place type. */
function passesPlaceTypesFilter(selected: string[] | undefined, keys: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return keys.some(key => selected.includes(key));
}

/** An exclusion place-type filter passes when empty (no filter) or none of the bookmark's location place types are in the excluded list. */
function passesPlaceTypesExclusion(selected: string[] | undefined, keys: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return !keys.some(key => selected.includes(key));
}

/** A "has"/"missing" presence filter checks whether the dimension is present. "exclude" is handled elsewhere; returns true so it doesn't double-filter. */
function passesPresence(mode: "has" | "missing" | "exclude" | undefined, present: boolean): boolean {
  if (mode === "has") return present;
  if (mode === "missing") return !present;
  return true;
}

/** Whether a bookmark passes the sections-presence filter. "exclude" is handled by passesSectionTypes, so it is a pass-through here. */
function passesSectionsPresence(bookmark: SearchableBookmark, mode: "has" | "missing" | "exclude" | undefined): boolean {
  if (!mode || mode === "exclude") return true;
  const hasSections = bookmark.sectionsValues.some(v => v.sections.length > 0);
  return mode === "has" ? hasSections : !hasSections;
}

/** Whether a bookmark passes the section-type filter. In include mode, at least one entry must match; in exclude mode, none may match. */
function passesSectionTypes(bookmark: SearchableBookmark, types: SectionEntryType[] | undefined, mode: "has" | "missing" | "exclude" | undefined): boolean {
  if (!types || types.length === 0) return true;
  const hasAny = bookmark.sectionsValues.some(sv => sv.sections.some(e => types.includes(e.type)));
  return mode === "exclude" ? !hasAny : hasAny;
}

/** Every per-property presence filter must be satisfied. "exclude" mode is handled by passesChoicesFilters. */
function passesPropertyPresence(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
  for (const [propertyId, mode] of Object.entries(search.presence ?? {})) {
    if (mode === "exclude") continue;
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

/** Every choices filter must match. In include mode (default) a bookmark passes if its values overlap the required set; in "exclude" presence mode a bookmark passes if none of its values are in the excluded set. */
function passesChoicesFilters(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
  for (const [propertyId, required] of Object.entries(search.choices ?? {})) {
    if (required.length === 0) continue;
    const presenceMode = search.presence?.[propertyId];
    const entry = bookmark.choicesValues.find(v => v.propertyId === propertyId);
    const bookmarkValues = entry?.values ?? [];
    if (presenceMode === "exclude") {
      if (required.some(v => bookmarkValues.includes(v))) return false;
    }
    else {
      if (!required.some(v => bookmarkValues.includes(v))) return false;
    }
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
    // YouTube channels: exclude mode uses passesIdFilterExclude; include/presence modes use the pair.
    && (search.youtubeChannelPresence === "exclude"
      ? passesIdFilterExclude(search.youtubeChannels, bookmark.youtubeChannel?.id)
      : passesIdFilter(search.youtubeChannels, bookmark.youtubeChannel?.id)
        && passesPresence(search.youtubeChannelPresence, Boolean(bookmark.youtubeChannel)))
    // Websites: same pattern as YouTube channels.
      && (search.websitePresence === "exclude"
        ? passesIdFilterExclude(search.websites, bookmark.website?.id)
        : passesIdFilter(search.websites, bookmark.website?.id)
          && passesPresence(search.websitePresence, Boolean(bookmark.website)))
        && passesRelationshipTypeFilter(search.relationshipTypes, bookmark)
        && passesLanguageUsagesFilter(search.languageUsageLanguages, search.languageUsageLevels, bookmark)
        && passesPeopleFilter(search.people, bookmark.people)
    // Place types: multi-valued (a bookmark can carry several locations), so "any match" like tags.
        && (search.placeTypePresence === "exclude"
          ? passesPlaceTypesExclusion(search.placeTypes, bookmarkPlaceTypeKeys(bookmark.locations))
          : passesPlaceTypesFilter(search.placeTypes, bookmarkPlaceTypeKeys(bookmark.locations))
            && passesPresence(search.placeTypePresence, bookmarkPlaceTypeKeys(bookmark.locations).length > 0))
    // Tags: server handles inclusion (tagsForServerQuery gates the query); client handles presence and exclude.
          && (search.tagPresence === "exclude"
            ? passesTagsExclusion(search.tags, bookmark.tags)
            : passesPresence(search.tagPresence, bookmark.tags.length > 0))
          && passesPropertyPresence(bookmark, search)
          && passesValueFilters(bookmark, search)
          && passesChoicesFilters(bookmark, search)
          && passesSectionsPresence(bookmark, search.sectionsPresence)
          && passesSectionTypes(bookmark, search.sectionTypes, search.sectionsPresence)
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
    || hasItems(search.languageUsageLanguages)
    || hasItems(search.languageUsageLevels)
    || hasItems(search.people)
    || hasItems(search.placeTypes)
    || search.placeTypePresence !== undefined
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
 * Setting `"exclude"` keeps the existing tag selection — those IDs become the exclusion list.
 */
export function withTagPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
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
 * Setting `"exclude"` keeps the existing selection — those IDs become the exclusion list.
 */
export function withYouTubeChannelPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
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

/** Return a copy of `search` with the person filter set, or cleared when `ids` is empty. */
export function withPeople(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.people;
  else next.people = ids;
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

/** Return a copy of `search` with the language-usage language filter set, or cleared when empty. */
export function withLanguageUsageLanguages(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.languageUsageLanguages;
  else next.languageUsageLanguages = ids;
  return next;
}

/** Return a copy of `search` with the language-usage level filter set, or cleared when empty. */
export function withLanguageUsageLevels(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.languageUsageLevels;
  else next.languageUsageLevels = ids;
  return next;
}

/** Return a copy of `search` with the place-type filter set, or cleared when `keys` is empty. */
export function withPlaceTypes(search: BookmarkSearch, keys: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (keys.length === 0) delete next.placeTypes;
  else next.placeTypes = keys;
  return next;
}

/**
 * Return a copy of `search` with the place-type-presence filter set or cleared.
 * Setting `"missing"` also clears any specific place-type selection (selecting one contradicts "none").
 * Setting `"exclude"` keeps the existing selection — those keys become the exclusion list.
 */
export function withPlaceTypePresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.placeTypePresence;
  }
  else {
    next.placeTypePresence = mode;
    if (mode === "missing") delete next.placeTypes;
  }
  return next;
}

/**
 * Return a copy of `search` with the website-presence filter set or cleared.
 * Setting `"missing"` also clears any specific website selection (selecting one contradicts "none").
 * Setting `"exclude"` keeps the existing selection — those IDs become the exclusion list.
 */
export function withWebsitePresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
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

/** Return a copy of `search` with the sections-presence filter set or cleared. "exclude" keeps existing sectionTypes as the exclusion list; "missing" does not clear them. */
export function withSectionsPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
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

/** Return a copy of `search` with the sort set, or cleared when `sort` is undefined. */
export function withSort(search: BookmarkSearch, sort: BookmarkSort | undefined): BookmarkSearch {
  const next = {
    ...search,
  };
  if (sort === undefined) delete next.sort;
  else next.sort = sort;
  return next;
}

/** Return a copy of `search` with a property-presence filter set or cleared. */
export function withPresenceFilter(
  search: BookmarkSearch,
  propertyId: string,
  mode: "has" | "missing" | "exclude" | undefined,
): BookmarkSearch {
  return {
    ...search,
    presence: patchRecord(search.presence, propertyId, mode),
  };
}

/**
 * Returns the tag IDs to pass to the server-side bookmark query. When `tagPresence` is
 * `"exclude"`, tag filtering is done client-side, so the server should receive no tag filter
 * (returning all bookmarks). Otherwise the server pre-filters by the selected tag IDs.
 */
export function tagsForServerQuery(search: BookmarkSearch): string[] | undefined {
  return search.tagPresence === "exclude" ? undefined : search.tags;
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

/**
 * Produce the [count, presence] summary fragments for an entity that has both a list of selected
 * ids and a `presence` mode ("include" / "exclude" / etc.). Returns two elements (either may be
 * null) so the caller can spread them directly into the parts array.
 */
function entityPresenceParts(
  ids: unknown[] | undefined,
  presence: string | undefined,
  singular: string,
  plural: string,
  label: string,
): [string | null, string | null] {
  const countFragment = presence === "exclude"
    ? countPart(ids?.length ?? 0, `excluded ${singular}`, `excluded ${plural}`)
    : countPart(ids?.length ?? 0, singular, plural);
  const presenceFragment = presence !== undefined && presence !== "exclude"
    ? `${label}: ${presence}`
    : null;
  return [countFragment, presenceFragment];
}

/** Format the sections-presence summary fragment. */
function sectionPresencePart(presence: string | undefined): string | null {
  if (presence === undefined) return null;
  return presence === "exclude" ? "sections: excluded types" : `sections: ${presence}`;
}

const SORT_FIELD_LABELS: Record<BuiltinSortField, string> = {
  title: "title",
  createdAt: "date added",
  updatedAt: "date updated",
};

/** Format the active-sort summary fragment, e.g. "sorted by title (asc)" or "sorted randomly". */
function sortSummaryPart(sort: BookmarkSort | undefined): string | null {
  if (!sort) return null;
  if ("random" in sort) return "sorted randomly";
  const label = SORT_FIELD_LABELS[sort.primary.field as BuiltinSortField] ?? "a property";
  return `sorted by ${label} (${sort.primary.direction})`;
}

export function summarizeBookmarkSearch(raw: Record<string, unknown>): string {
  const search = validateBookmarkSearch(raw);
  const propCount
    = Object.keys(search.num ?? {}).length
      + Object.keys(search.bool ?? {}).length
      + Object.keys(search.date ?? {}).length
      + Object.keys(search.presence ?? {}).length
      + Object.keys(search.choices ?? {}).length;
  const parts: (string | null)[] = [
    countPart(search.categories?.length ?? 0, "category", "categories"),
    countPart(search.mediaTypes?.length ?? 0, "media type", "media types"),
    ...entityPresenceParts(search.youtubeChannels, search.youtubeChannelPresence, "channel", "channels", "channel"),
    ...entityPresenceParts(search.websites, search.websitePresence, "website", "websites", "website"),
    countPart(search.relationshipTypes?.length ?? 0, "relationship type", "relationship types"),
    countPart(search.languageUsageLanguages?.length ?? 0, "usage language", "usage languages"),
    countPart(search.languageUsageLevels?.length ?? 0, "usage level", "usage levels"),
    countPart(search.people?.length ?? 0, "person", "people"),
    ...entityPresenceParts(search.placeTypes, search.placeTypePresence, "place type", "place types", "place type"),
    ...entityPresenceParts(search.tags, search.tagPresence, "tag", "tags", "tags"),
    countPart(propCount, "property", "properties"),
    sectionPresencePart(search.sectionsPresence),
    search.sectionTypes && search.sectionTypes.length > 0 ? `section types: ${search.sectionTypes.join(", ")}` : null,
    sortSummaryPart(search.sort),
  ];
  return parts.filter((part): part is string => part !== null).join(" · ") || "No filters";
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
