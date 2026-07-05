import type { Bookmark } from "@eesimple/types";

import i18n from "../i18n";

/**
 * The listing pages let you filter a bookmark set in memory. A bookmark links to at most one media
 * taxonomy item via a nullable FK (`movieId`/`bookId`/…). This helper is the inverse join of
 * `mediaPropertyMembership.ts`: given the *filtered* bookmarks, it returns the distinct media items
 * they reference — each with the count of matching bookmarks — so a listing page can show a "Media"
 * tab beside its bookmarks. Purely client-side over lists the page already caches (no endpoint), per
 * the sanctioned client-side-derivation rule.
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

/** One media item referenced by the filtered bookmarks. */
export interface MediaMatchItem {
  kind: MediaKind;
  id: string;
  slug: string;
  name: string;
  /** Human label for the item's kind, e.g. "Movie". */
  label: string;
  /** How many of the filtered bookmarks link to this item. */
  matchCount: number;
}

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
 * The distinct media items referenced by `bookmarks`, resolved against the cached `lists`, sorted by
 * descending match count then name. Referenced ids missing from a list (e.g. still loading) are
 * skipped rather than shown as a broken row.
 */
export function mediaItemsForBookmarks(
  bookmarks: readonly Bookmark[],
  lists: MediaLists,
): MediaMatchItem[] {
  const results: MediaMatchItem[] = [];
  for (const config of MEDIA_KINDS) {
    const counts = tallyFkCounts(bookmarks, config.fkField);
    if (counts.size === 0) continue;
    const byId = new Map(lists[config.listKey].map(item => [item.id, item]));
    for (const [id, matchCount] of counts) {
      const item = byId.get(id);
      if (!item) continue;
      results.push({
        kind: config.kind,
        id,
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
