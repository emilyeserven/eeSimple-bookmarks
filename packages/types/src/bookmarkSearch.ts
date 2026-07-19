import type { SectionEntryType } from "./customProperties.js";
import type { BookmarkSort, BookmarkSortDimension, SortDirection } from "./index.js";

import { SECTION_ENTRY_TYPES } from "./customProperties.js";

/**
 * URL-persisted filter state shared by the search pages (the Bookmarks page and each
 * category page). `num` holds `[lo, hi]` ranges keyed by number/calculate property id;
 * `bool` holds required boolean values keyed by boolean property id. TanStack Router's
 * default search serializer round-trips these nested objects/arrays. Shared with the
 * middleware, which evaluates the same shape server-side (`POST /api/bookmarks/search`).
 */
export interface BookmarkSearch {
  /**
   * Restrict to bookmarks whose tag is one of these ids (empty/absent = all tags). The server
   * expands each id to its full subtree for inclusion; exclusion ("exclude" mode) uses exact
   * matching only (no subtree expansion).
   */
  tags?: string[];
  /** Filter bookmarks by tag: "has" = has any tag, "missing" = no tags, "exclude" = does not have the selected tags. */
  tagPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose category is one of these ids (empty/absent = all categories). */
  categories?: string[];
  /** Filter bookmarks by category: "has" = has a category, "missing" = none, "exclude" = does not have the selected categories. */
  categoryPresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose media type is one of these ids (empty/absent = all media types). */
  mediaTypes?: string[];
  /** Filter bookmarks by media type: "has" = has a media type, "missing" = none, "exclude" = does not have the selected media types. */
  mediaTypePresence?: "has" | "missing" | "exclude";
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
   * `placeTypeKey` — a bookmark can carry several locations, so this is an "any match" filter
   * like tags, not a 1:1 id comparison.
   */
  placeTypes?: string[];
  /** Filter bookmarks by place type: "has" = has any location with a place type, "missing" = none, "exclude" = does not have the selected place types. */
  placeTypePresence?: "has" | "missing" | "exclude";
  /** Restrict to bookmarks whose person list overlaps with these ids (empty/absent = all). */
  people?: string[];
  /** Filter bookmarks by person: "has" = has any, "missing" = none, "exclude" = does not have the selected people. */
  peoplePresence?: "has" | "missing" | "exclude";
  /**
   * Restrict to bookmarks carrying at least one of these Genres & Moods ids (empty/absent = all).
   * A bookmark can carry several, so this is an "any match" filter like place types, not a 1:1 id
   * comparison.
   */
  genreMoods?: string[];
  /** Filter bookmarks by Genres & Moods: "has" = has any, "missing" = none, "exclude" = does not have the selected entries. */
  genreMoodPresence?: "has" | "missing" | "exclude";
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
  /**
   * Filter bookmarks by whether they carry any Plex/Kavita/ISBN/podcast-feed identity (see #1072):
   * "has" = at least one identity field is set, "missing" = none are.
   */
  mediaSourcePresence?: "has" | "missing";
  /**
   * Exact-match media-source identity filters — not surfaced as sidebar pickers (there's no
   * taxonomy of values to choose from), only set via the "N bookmarks share this item" deep link
   * on the bookmark detail page. At most one is meaningfully set at a time.
   */
  plexRatingKey?: string;
  kavitaSeriesId?: number;
  isbn?: string;
  feedUrl?: string;
  /**
   * Filter bookmarks by whether their website has an extension-fill rule targeting a bookmark field:
   * "fillable" = has fillable fields at all (`Bookmark.hasAnyFillableField`, filled or not),
   * "has" = has an *unfilled* fillable field / something left to fill (`Bookmark.hasFillableFields`),
   * "missing" = nothing left to fill (`!Bookmark.hasFillableFields`). "has" keeps its original
   * meaning so existing URLs / saved filters stay valid.
   */
  fillableFieldsPresence?: "has" | "fillable" | "missing";
  /** Active sort order (primary + optional secondary dimension, or a random shuffle). Absent = the default `createdAt DESC` order. */
  sort?: BookmarkSort;
}

/** A single owner's language-usage association, reduced to the two ids the filter compares against. */
export interface OwnerLanguageUsage {
  languageId: string;
  usageLevelId: string;
}

/** The exact-match media-source identity fields a deep link can target (see `withMediaSourceMatch`). */
export type MediaSourceMatchField = "plexRatingKey" | "kavitaSeriesId" | "isbn" | "feedUrl";

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

/** Narrow a presence value to the `"has" | "missing"` enum (no "exclude"), or `undefined` if malformed. */
function validHasMissingPresence(value: unknown): "has" | "missing" | undefined {
  return value === "has" || value === "missing" ? value : undefined;
}

/** Narrow the fillable-fields filter value to `"has" | "fillable" | "missing"`, or `undefined` if malformed. */
function validFillableFieldsPresence(value: unknown): "has" | "fillable" | "missing" | undefined {
  return value === "has" || value === "fillable" || value === "missing" ? value : undefined;
}

/** Keep a value only if it is a non-empty string. */
function validString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Keep a value only if it is a number. */
function validNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** Keep a parsed record only if it has at least one entry (an empty record is not an active filter). */
function nonEmptyRecord<T extends Record<string, unknown>>(record: T): T | undefined {
  return Object.keys(record).length > 0 ? record : undefined;
}

const VALID_SECTION_TYPES = new Set<string>(SECTION_ENTRY_TYPES);

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
    categoryPresence: validPresence(search.categoryPresence),
    mediaTypes: validStringList(search.mediaTypes),
    mediaTypePresence: validPresence(search.mediaTypePresence),
    youtubeChannels: validStringList(search.youtubeChannels),
    youtubeChannelPresence: validPresence(search.youtubeChannelPresence),
    websites: validStringList(search.websites),
    websitePresence: validPresence(search.websitePresence),
    relationshipTypes: validStringList(search.relationshipTypes),
    languageUsageLanguages: validStringList(search.languageUsageLanguages),
    languageUsageLevels: validStringList(search.languageUsageLevels),
    people: validStringList(search.people),
    peoplePresence: validPresence(search.peoplePresence),
    placeTypes: validStringList(search.placeTypes),
    placeTypePresence: validPresence(search.placeTypePresence),
    genreMoods: validStringList(search.genreMoods),
    genreMoodPresence: validPresence(search.genreMoodPresence),
    num: nonEmptyRecord(parseNumRecord(search.num)),
    bool: nonEmptyRecord(parseBoolRecord(search.bool)),
    date: nonEmptyRecord(parseDateRecord(search.date)),
    presence: nonEmptyRecord(parsePresenceRecord(search.presence)),
    choices: nonEmptyRecord(parseChoicesRecord(search.choices)),
    sectionsPresence: validPresence(search.sectionsPresence),
    sectionTypes: validSectionTypes(search.sectionTypes),
    mediaSourcePresence: validHasMissingPresence(search.mediaSourcePresence),
    plexRatingKey: validString(search.plexRatingKey),
    kavitaSeriesId: validNumber(search.kavitaSeriesId),
    isbn: validString(search.isbn),
    feedUrl: validString(search.feedUrl),
    fillableFieldsPresence: validFillableFieldsPresence(search.fillableFieldsPresence),
    sort: validSort(search.sort),
  };

  // Drop the keys that came back undefined so the result has no empty/absent filter entries.
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(candidates)) {
    if (value !== undefined) result[key] = value;
  }
  return result as BookmarkSearch;
}
