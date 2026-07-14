import type { BookmarkSearch, OwnerLanguageUsage } from "./bookmarkSearchTypes";
import type { Bookmark, BookmarkGenreMood, BookmarkPerson, BookmarkLocation, BookmarkTag, SectionEntryType } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";

import { validateBookmarkSearch } from "./bookmarkSearchValidate";
import { bookmarkMatchesFilters } from "./customPropertyFilter";

type SearchableBookmark = Pick<
  Bookmark,
  | "categoryId"
  | "mediaType"
  | "youtubeChannel"
  | "website"
  | "tags"
  | "genreMoods"
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
  | "plexRatingKey"
  | "kavitaSeriesId"
  | "isbn"
  | "feedUrl"
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
 * both non-empty constraints (a language-only or level-only filter matches on that one axis). Takes
 * the owner's association rows directly (not a full bookmark) so it can be reused against any owner
 * — e.g. a media taxonomy item's own `language_usages` rows in the "Media" tab.
 */
export function passesLanguageUsagesFilter(
  languages: string[] | undefined,
  levels: string[] | undefined,
  usages: OwnerLanguageUsage[],
): boolean {
  const hasLang = languages !== undefined && languages.length > 0;
  const hasLevel = levels !== undefined && levels.length > 0;
  if (!hasLang && !hasLevel) return true;
  return usages.some(usage =>
    (!hasLang || languages.includes(usage.languageId))
    && (!hasLevel || levels.includes(usage.usageLevelId)));
}

/** A multi-select person filter passes when empty or the bookmark has at least one matching person. */
function passesPeopleFilter(selected: string[] | undefined, people: BookmarkPerson[]): boolean {
  if (!selected || selected.length === 0) return true;
  return people.some(a => selected.includes(a.id));
}

/** An exclusion people filter passes when empty or none of the bookmark's people appear in the excluded-ids list. */
function passesPeopleExclusion(selected: string[] | undefined, people: BookmarkPerson[]): boolean {
  if (!selected || selected.length === 0) return true;
  return !people.some(a => selected.includes(a.id));
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
export function passesPlaceTypesFilter(selected: string[] | undefined, keys: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return keys.some(key => selected.includes(key));
}

/** The Genres & Moods ids carried by a bookmark. */
function bookmarkGenreMoodIds(genreMoods: BookmarkGenreMood[]): string[] {
  return genreMoods.map(entry => entry.id);
}

/** A multi-select Genres & Moods filter passes when empty or the bookmark carries a matching entry. */
export function passesGenreMoodsFilter(selected: string[] | undefined, ids: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return ids.some(id => selected.includes(id));
}

/** An exclusion Genres & Moods filter passes when empty or the bookmark carries none of the excluded entries. */
export function passesGenreMoodsExclusion(selected: string[] | undefined, ids: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return !ids.some(id => selected.includes(id));
}

/** An exclusion place-type filter passes when empty (no filter) or none of the bookmark's location place types are in the excluded list. */
export function passesPlaceTypesExclusion(selected: string[] | undefined, keys: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return !keys.some(key => selected.includes(key));
}

/** A "has"/"missing" presence filter checks whether the dimension is present. "exclude" is handled elsewhere; returns true so it doesn't double-filter. */
export function passesPresence(mode: "has" | "missing" | "exclude" | undefined, present: boolean): boolean {
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

/** Whether a bookmark carries any Plex/Kavita/ISBN/podcast-feed identity (see #1072). */
function hasMediaSourceIdentity(bookmark: SearchableBookmark): boolean {
  return bookmark.plexRatingKey != null
    || bookmark.kavitaSeriesId != null
    || bookmark.isbn != null
    || bookmark.feedUrl != null;
}

/** Whether a bookmark matches every set exact-value media-source identity filter in `search`. */
function passesMediaSourceMatch(bookmark: SearchableBookmark, search: BookmarkSearch): boolean {
  return (search.plexRatingKey === undefined || bookmark.plexRatingKey === search.plexRatingKey)
    && (search.kavitaSeriesId === undefined || bookmark.kavitaSeriesId === search.kavitaSeriesId)
    && (search.isbn === undefined || bookmark.isbn === search.isbn)
    && (search.feedUrl === undefined || bookmark.feedUrl === search.feedUrl);
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

/** A non-empty array filter. */
function hasItems(value: readonly unknown[] | undefined): boolean {
  return (value?.length ?? 0) > 0;
}

/** A record filter with at least one keyed entry. */
function hasEntries(value: Record<string, unknown> | undefined): boolean {
  return Object.keys(value ?? {}).length > 0;
}

/**
 * One entry in the {@link BOOKMARK_SEARCH_FACETS} table: how a facet matches a bookmark, and
 * whether it currently holds an active filter (used by {@link hasAnyActiveFilter}). Adding a new
 * search facet means adding one entry here rather than editing `bookmarkMatchesSearch` and
 * `hasAnyActiveFilter` separately.
 */
interface BookmarkSearchFacet {
  matches: (bookmark: SearchableBookmark, search: BookmarkSearch) => boolean;
  isActive: (search: BookmarkSearch) => boolean;
}

/**
 * Build a {@link BookmarkSearchFacet} for the common "single id + has/missing/exclude presence"
 * shape shared by Categories, Media Types, YouTube Channels, and Websites: exclude mode routes
 * through `passesIdFilterExclude`; include/presence modes use `passesIdFilter` + `passesPresence`.
 */
function idPresenceFacet(
  selected: (search: BookmarkSearch) => string[] | undefined,
  presence: (search: BookmarkSearch) => "has" | "missing" | "exclude" | undefined,
  value: (bookmark: SearchableBookmark) => string | null | undefined,
): BookmarkSearchFacet {
  return {
    matches: (bookmark, search) => {
      const mode = presence(search);
      const ids = selected(search);
      const v = value(bookmark);
      return mode === "exclude"
        ? passesIdFilterExclude(ids, v)
        : passesIdFilter(ids, v) && passesPresence(mode, Boolean(v));
    },
    isActive: search => hasItems(selected(search)) || presence(search) !== undefined,
  };
}

const BOOKMARK_SEARCH_FACETS: BookmarkSearchFacet[] = [
  idPresenceFacet(search => search.categories, search => search.categoryPresence, bookmark => bookmark.categoryId),
  idPresenceFacet(search => search.mediaTypes, search => search.mediaTypePresence, bookmark => bookmark.mediaType?.id),
  idPresenceFacet(search => search.youtubeChannels, search => search.youtubeChannelPresence, bookmark => bookmark.youtubeChannel?.id),
  idPresenceFacet(search => search.websites, search => search.websitePresence, bookmark => bookmark.website?.id),
  {
    matches: (bookmark, search) => passesRelationshipTypeFilter(search.relationshipTypes, bookmark),
    isActive: search => hasItems(search.relationshipTypes),
  },
  {
    matches: (bookmark, search) => passesLanguageUsagesFilter(
      search.languageUsageLanguages,
      search.languageUsageLevels,
      bookmark.languageUsages.map(usage => ({
        languageId: usage.language.id,
        usageLevelId: usage.level.id,
      })),
    ),
    isActive: search => hasItems(search.languageUsageLanguages) || hasItems(search.languageUsageLevels),
  },
  {
    matches: (bookmark, search) => search.peoplePresence === "exclude"
      ? passesPeopleExclusion(search.people, bookmark.people)
      : passesPeopleFilter(search.people, bookmark.people)
        && passesPresence(search.peoplePresence, bookmark.people.length > 0),
    isActive: search => hasItems(search.people) || search.peoplePresence !== undefined,
  },
  // Place types are multi-valued (a bookmark can carry several locations), so "any match" like tags.
  {
    matches: (bookmark, search) => search.placeTypePresence === "exclude"
      ? passesPlaceTypesExclusion(search.placeTypes, bookmarkPlaceTypeKeys(bookmark.locations))
      : passesPlaceTypesFilter(search.placeTypes, bookmarkPlaceTypeKeys(bookmark.locations))
        && passesPresence(search.placeTypePresence, bookmarkPlaceTypeKeys(bookmark.locations).length > 0),
    isActive: search => hasItems(search.placeTypes) || search.placeTypePresence !== undefined,
  },
  // Genres & Moods are multi-valued (a bookmark can carry several), so "any match" like place types.
  {
    matches: (bookmark, search) => search.genreMoodPresence === "exclude"
      ? passesGenreMoodsExclusion(search.genreMoods, bookmarkGenreMoodIds(bookmark.genreMoods))
      : passesGenreMoodsFilter(search.genreMoods, bookmarkGenreMoodIds(bookmark.genreMoods))
        && passesPresence(search.genreMoodPresence, bookmark.genreMoods.length > 0),
    isActive: search => hasItems(search.genreMoods) || search.genreMoodPresence !== undefined,
  },
  // Tags: server handles inclusion (tagsForServerQuery gates the query); client handles presence and exclude.
  {
    matches: (bookmark, search) => search.tagPresence === "exclude"
      ? passesTagsExclusion(search.tags, bookmark.tags)
      : passesPresence(search.tagPresence, bookmark.tags.length > 0),
    isActive: search => hasItems(search.tags) || search.tagPresence !== undefined,
  },
  {
    matches: (bookmark, search) => passesPropertyPresence(bookmark, search),
    isActive: search => hasEntries(search.presence),
  },
  {
    matches: (bookmark, search) => passesValueFilters(bookmark, search),
    isActive: search => hasEntries(search.num) || hasEntries(search.bool) || hasEntries(search.date),
  },
  {
    matches: (bookmark, search) => passesChoicesFilters(bookmark, search),
    isActive: search => hasEntries(search.choices),
  },
  {
    matches: (bookmark, search) => passesSectionsPresence(bookmark, search.sectionsPresence)
      && passesSectionTypes(bookmark, search.sectionTypes, search.sectionsPresence),
    isActive: search => search.sectionsPresence !== undefined || hasItems(search.sectionTypes),
  },
  {
    matches: (bookmark, search) => passesPresence(search.mediaSourcePresence, hasMediaSourceIdentity(bookmark))
      && passesMediaSourceMatch(bookmark, search),
    isActive: search => search.mediaSourcePresence !== undefined
      || search.plexRatingKey !== undefined
      || search.kavitaSeriesId !== undefined
      || search.isbn !== undefined
      || search.feedUrl !== undefined,
  },
];

/** Whether a bookmark satisfies every active filter in `search`. */
export function bookmarkMatchesSearch(
  bookmark: SearchableBookmark,
  search: BookmarkSearch,
): boolean {
  return BOOKMARK_SEARCH_FACETS.every(facet => facet.matches(bookmark, search));
}

/** Whether any filter in `search` is active (used to choose the empty-state message). */
export function hasAnyActiveFilter(search: BookmarkSearch): boolean {
  return BOOKMARK_SEARCH_FACETS.some(facet => facet.isActive(search));
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
