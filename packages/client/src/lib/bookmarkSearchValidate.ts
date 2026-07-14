import type { BookmarkSearch } from "./bookmarkSearchTypes";
import type { BookmarkSort, BookmarkSortDimension, BuiltinSortField, SortDirection } from "./bookmarkSort";
import type { SectionEntryType } from "@eesimple/types";

import { SECTION_ENTRY_TYPES } from "@eesimple/types";

import i18n from "../i18n";

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
    sort: validSort(search.sort),
  };

  // Drop the keys that came back undefined so the result has no empty/absent filter entries.
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(candidates)) {
    if (value !== undefined) result[key] = value;
  }
  return result as BookmarkSearch;
}

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

/**
 * Return a human-readable summary of the active filters in a raw stored filter blob
 * (e.g. "2 categories · 1 tag · 1 property"). Accepts `Record<string, unknown>` so it can be
 * called on the JSONB blob from the API without a cast at the call site.
 */
export function summarizeBookmarkSearch(raw: Record<string, unknown>): string {
  const search = validateBookmarkSearch(raw);
  const propCount
    = Object.keys(search.num ?? {}).length
      + Object.keys(search.bool ?? {}).length
      + Object.keys(search.date ?? {}).length
      + Object.keys(search.presence ?? {}).length
      + Object.keys(search.choices ?? {}).length;
  const parts: (string | null)[] = [
    ...entityPresenceParts(search.categories, search.categoryPresence, "category", "categories", "category"),
    ...entityPresenceParts(search.mediaTypes, search.mediaTypePresence, "media type", "media types", "media type"),
    ...entityPresenceParts(search.youtubeChannels, search.youtubeChannelPresence, "channel", "channels", "channel"),
    ...entityPresenceParts(search.websites, search.websitePresence, "website", "websites", "website"),
    countPart(search.relationshipTypes?.length ?? 0, "relationship type", "relationship types"),
    countPart(search.languageUsageLanguages?.length ?? 0, "usage language", "usage languages"),
    countPart(search.languageUsageLevels?.length ?? 0, "usage level", "usage levels"),
    ...entityPresenceParts(search.people, search.peoplePresence, "person", "people", "person"),
    ...entityPresenceParts(search.placeTypes, search.placeTypePresence, "place type", "place types", "place type"),
    ...entityPresenceParts(search.tags, search.tagPresence, "tag", "tags", "tags"),
    countPart(propCount, "property", "properties"),
    sectionPresencePart(search.sectionsPresence),
    search.sectionTypes && search.sectionTypes.length > 0 ? `section types: ${search.sectionTypes.join(", ")}` : null,
    search.mediaSourcePresence !== undefined ? `media source: ${search.mediaSourcePresence}` : null,
    sortSummaryPart(search.sort),
  ];
  return parts.filter((part): part is string => part !== null).join(" · ") || i18n.t("No filters");
}
