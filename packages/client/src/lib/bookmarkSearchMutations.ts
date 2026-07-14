import type { BookmarkSearch, MediaSourceMatchField } from "./bookmarkSearchTypes";
import type { BookmarkSort } from "./bookmarkSort";
import type { SectionEntryType } from "@eesimple/types";

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

/**
 * Return a copy of `search` with the category-presence filter set or cleared.
 * Setting `"missing"` also clears any specific category selection (selecting one contradicts "none").
 * Setting `"exclude"` keeps the existing selection — those IDs become the exclusion list.
 */
export function withCategoryPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.categoryPresence;
  }
  else {
    next.categoryPresence = mode;
    if (mode === "missing") delete next.categories;
  }
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

/**
 * Return a copy of `search` with the media-type-presence filter set or cleared.
 * Setting `"missing"` also clears any specific media-type selection (selecting one contradicts "none").
 * Setting `"exclude"` keeps the existing selection — those IDs become the exclusion list.
 */
export function withMediaTypePresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.mediaTypePresence;
  }
  else {
    next.mediaTypePresence = mode;
    if (mode === "missing") delete next.mediaTypes;
  }
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

/**
 * Return a copy of `search` with the people-presence filter set or cleared.
 * Setting `"missing"` also clears any specific person selection (selecting one contradicts "none").
 * Setting `"exclude"` keeps the existing selection — those IDs become the exclusion list.
 */
export function withPeoplePresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.peoplePresence;
  }
  else {
    next.peoplePresence = mode;
    if (mode === "missing") delete next.people;
  }
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

/** Return a copy of `search` with the Genres & Moods filter set, or cleared when `ids` is empty. */
export function withGenreMoods(search: BookmarkSearch, ids: string[]): BookmarkSearch {
  const next = {
    ...search,
  };
  if (ids.length === 0) delete next.genreMoods;
  else next.genreMoods = ids;
  return next;
}

/**
 * Return a copy of `search` with the Genres & Moods presence filter set or cleared.
 * Setting `"missing"` also clears any specific selection (selecting one contradicts "none").
 * Setting `"exclude"` keeps the existing selection — those ids become the exclusion list.
 */
export function withGenreMoodPresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | "exclude" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) {
    delete next.genreMoodPresence;
  }
  else {
    next.genreMoodPresence = mode;
    if (mode === "missing") delete next.genreMoods;
  }
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

/** Return a copy of `search` with the media-source-presence filter set or cleared. */
export function withMediaSourcePresence(
  search: BookmarkSearch,
  mode: "has" | "missing" | undefined,
): BookmarkSearch {
  const next = {
    ...search,
  };
  if (mode === undefined) delete next.mediaSourcePresence;
  else next.mediaSourcePresence = mode;
  return next;
}

/**
 * Return a fresh search with only the given media-source identity field set to `value` — clears
 * the other three exact-match fields (and any other active filter) so the "N bookmarks share this
 * item" deep link from the bookmark detail page lands on exactly the matching set.
 */
export function withMediaSourceMatch(
  field: MediaSourceMatchField,
  value: string | number,
): BookmarkSearch {
  return {
    [field]: value,
  } as BookmarkSearch;
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
