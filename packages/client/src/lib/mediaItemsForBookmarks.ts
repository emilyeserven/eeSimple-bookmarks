import type { BookmarkSearch, OwnerLanguageUsage } from "./bookmarkSearch";
import type { Bookmark } from "@eesimple/types";

import i18n from "../i18n";
import {
  passesGenreMoodsExclusion,
  passesGenreMoodsFilter,
  passesLanguageUsagesFilter,
  passesPlaceTypesExclusion,
  passesPlaceTypesFilter,
  passesPresence,
} from "./bookmarkSearch";

/**
 * The listing pages let you filter a bookmark set in memory. A bookmark links to at most one media
 * taxonomy item via a nullable FK (`movieId`/`bookId`/…). This helper backs the "Media" tab beside a
 * listing page's bookmarks: it returns the distinct media items the *filtered* bookmarks reference
 * (with a match count), **plus** any item that independently matches the active free-text query,
 * Genre/Mood, place-type, or language-usage filters via its own associations — even with zero linked
 * bookmarks (issue #1027). Independent-match checks mirror `bookmarkMatchesSearch`'s predicates for
 * those four dimensions; other filter dimensions (tags, category, custom properties, …) don't apply
 * to media items and are ignored here — so with no active filters/query, every cached item counts as
 * an independent match and the tab shows everything. Purely client-side over lists/associations the
 * page already caches (no endpoint), per the sanctioned client-side-derivation rule.
 */

/** The seven media taxonomies a bookmark can link to. */
export type MediaKind = "movie" | "tvShow" | "episode" | "album" | "track" | "book" | "podcast";

/** The bookmark FK columns that carry a media-item link. */
type MediaFkField
  = | "movieId" | "tvShowId" | "episodeId" | "albumId" | "trackId" | "bookId" | "podcastId";

/**
 * The minimal shape this helper reads off each cached media list. Every media type (`Movie`, `Book`,
 * …) is structurally assignable, so callers pass their full lists unchanged and tests need no
 * shared-entity factory (avoiding the inline-literal drift the factories guard against).
 */
export interface MediaListItem {
  id: string;
  slug: string;
  name: string;
}

/** The cached media lists a listing page loads to resolve the FK links. */
export interface MediaLists {
  movies: MediaListItem[];
  tvShows: MediaListItem[];
  episodes: MediaListItem[];
  albums: MediaListItem[];
  tracks: MediaListItem[];
  books: MediaListItem[];
  podcasts: MediaListItem[];
}

/** One media item referenced by the filtered bookmarks, or independently matching the active filters. */
export interface MediaMatchItem {
  kind: MediaKind;
  id: string;
  slug: string;
  name: string;
  /** Human label for the item's kind, e.g. "Movie". */
  label: string;
  /** How many of the filtered bookmarks link to this item. 0 = shown only via an independent match. */
  matchCount: number;
}

/** One media item's own Genre/Mood, place-type, and language-usage associations, keyed by item id. */
export interface MediaKindAssociations {
  genreMoodIdsByOwner: Record<string, string[]>;
  placeTypeKeysByOwner: Record<string, string[]>;
  languageUsagesByOwner: Record<string, OwnerLanguageUsage[]>;
}

/** Per-kind associations, keyed by `MediaKind`. A missing/absent kind is treated as having none. */
export type MediaAssociationsByKind = Partial<Record<MediaKind, MediaKindAssociations>>;

const EMPTY_KIND_ASSOCIATIONS: MediaKindAssociations = {
  genreMoodIdsByOwner: {},
  placeTypeKeysByOwner: {},
  languageUsagesByOwner: {},
};

interface MediaKindConfig {
  kind: MediaKind;
  fkField: MediaFkField;
  listKey: keyof MediaLists;
  label: string;
}

/**
 * The single edit point per media taxonomy. Adding a new media taxonomy = add one entry here (plus
 * its `<Link>` branch in `MediaItemsPane`), mirroring `mediaPropertyMembership`'s seven-way list.
 */
export const MEDIA_KINDS: readonly MediaKindConfig[] = [
  {
    kind: "movie",
    fkField: "movieId",
    listKey: "movies",
    label: i18n.t("Movie"),
  },
  {
    kind: "tvShow",
    fkField: "tvShowId",
    listKey: "tvShows",
    label: i18n.t("TV Show"),
  },
  {
    kind: "episode",
    fkField: "episodeId",
    listKey: "episodes",
    label: i18n.t("Episode"),
  },
  {
    kind: "album",
    fkField: "albumId",
    listKey: "albums",
    label: i18n.t("Album"),
  },
  {
    kind: "track",
    fkField: "trackId",
    listKey: "tracks",
    label: i18n.t("Track"),
  },
  {
    kind: "book",
    fkField: "bookId",
    listKey: "books",
    label: i18n.t("Book"),
  },
  {
    kind: "podcast",
    fkField: "podcastId",
    listKey: "podcasts",
    label: i18n.t("Podcast"),
  },
];

/** Count, per non-null FK id, how many of the bookmarks link to it. */
function tallyFkCounts(bookmarks: readonly Bookmark[], fkField: MediaFkField): Map<string, number> {
  const counts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    const id = bookmark[fkField];
    if (id != null) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Whether a media item independently matches the active filters via its own associations — the four
 * dimensions a media item can carry (free-text name, Genre/Mood, place-type, language usage). Each
 * check is vacuously true when its filter is inactive, so with nothing active every item matches.
 */
function matchesIndependently(
  item: MediaListItem,
  search: BookmarkSearch,
  normalizedQuery: string,
  associations: MediaKindAssociations,
): boolean {
  if (normalizedQuery && !item.name.toLowerCase().includes(normalizedQuery)) return false;

  const genreMoodIds = associations.genreMoodIdsByOwner[item.id] ?? [];
  const genreMoodOk = search.genreMoodPresence === "exclude"
    ? passesGenreMoodsExclusion(search.genreMoods, genreMoodIds)
    : passesGenreMoodsFilter(search.genreMoods, genreMoodIds)
      && passesPresence(search.genreMoodPresence, genreMoodIds.length > 0);
  if (!genreMoodOk) return false;

  const placeTypeKeys = associations.placeTypeKeysByOwner[item.id] ?? [];
  const placeTypeOk = search.placeTypePresence === "exclude"
    ? passesPlaceTypesExclusion(search.placeTypes, placeTypeKeys)
    : passesPlaceTypesFilter(search.placeTypes, placeTypeKeys)
      && passesPresence(search.placeTypePresence, placeTypeKeys.length > 0);
  if (!placeTypeOk) return false;

  const languageUsages = associations.languageUsagesByOwner[item.id] ?? [];
  if (!passesLanguageUsagesFilter(search.languageUsageLanguages, search.languageUsageLevels, languageUsages)) {
    return false;
  }

  return true;
}

/**
 * The media items referenced by `bookmarks` (resolved against the cached `lists`) plus any item that
 * independently matches `search`/`textQuery` via its own associations, sorted by descending match
 * count then name. Referenced ids missing from a list (e.g. still loading) are skipped rather than
 * shown as a broken row. `search`/`textQuery`/`associations` default to "no active filters", under
 * which every cached item independently matches.
 */
export function mediaItemsForBookmarks(
  bookmarks: readonly Bookmark[],
  lists: MediaLists,
  search: BookmarkSearch = {},
  textQuery = "",
  associations: MediaAssociationsByKind = {},
): MediaMatchItem[] {
  const normalizedQuery = textQuery.trim().toLowerCase();
  const results: MediaMatchItem[] = [];
  for (const config of MEDIA_KINDS) {
    const counts = tallyFkCounts(bookmarks, config.fkField);
    const kindAssociations = associations[config.kind] ?? EMPTY_KIND_ASSOCIATIONS;
    for (const item of lists[config.listKey]) {
      const matchCount = counts.get(item.id) ?? 0;
      if (matchCount === 0 && !matchesIndependently(item, search, normalizedQuery, kindAssociations)) continue;
      results.push({
        kind: config.kind,
        id: item.id,
        slug: item.slug,
        name: item.name,
        label: config.label,
        matchCount,
      });
    }
  }
  results.sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name));
  return results;
}
