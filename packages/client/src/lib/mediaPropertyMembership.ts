import type { Album, Book, Bookmark, Episode, Movie, Podcast, Track, TvShow } from "@eesimple/types";

/**
 * Resolving "which bookmarks belong to a media property" — a franchise/IP grouping — needs a hop
 * through the property's member media items, because bookmarks carry no `mediaPropertyId` of their own.
 * A bookmark links to a single media item (`movieId`/`bookId`/…); that item may carry a
 * `mediaPropertyId`. So membership is: bookmark → its media item → that item's media property.
 *
 * These pure helpers do the O(n) join over lists the media-property page already loaded, keeping the
 * cross-list math out of the route component (and unit-testable on its own).
 */

/** The cached media lists a media-property page loads to resolve membership. */
export interface MediaPropertyLists {
  movies: Movie[];
  tvShows: TvShow[];
  episodes: Episode[];
  albums: Album[];
  tracks: Track[];
  books: Book[];
  podcasts: Podcast[];
}

/** Per-kind sets of member item ids grouped under a given media property. */
export interface MediaPropertyMemberIds {
  movieIds: Set<string>;
  tvShowIds: Set<string>;
  episodeIds: Set<string>;
  albumIds: Set<string>;
  trackIds: Set<string>;
  bookIds: Set<string>;
  podcastIds: Set<string>;
}

/** The ids of the items in one list that are grouped under `mediaPropertyId`. */
function idsForProperty<T extends { id: string;
  mediaPropertyId: string | null; }>(
  items: T[] | undefined,
  mediaPropertyId: string,
): Set<string> {
  return new Set(
    (items ?? []).filter(item => item.mediaPropertyId === mediaPropertyId).map(item => item.id),
  );
}

/** Collect, per media kind, the ids of the items grouped under `mediaPropertyId`. */
export function memberItemIdsByType(
  mediaPropertyId: string,
  lists: Partial<MediaPropertyLists>,
): MediaPropertyMemberIds {
  return {
    movieIds: idsForProperty(lists.movies, mediaPropertyId),
    tvShowIds: idsForProperty(lists.tvShows, mediaPropertyId),
    episodeIds: idsForProperty(lists.episodes, mediaPropertyId),
    albumIds: idsForProperty(lists.albums, mediaPropertyId),
    trackIds: idsForProperty(lists.tracks, mediaPropertyId),
    bookIds: idsForProperty(lists.books, mediaPropertyId),
    podcastIds: idsForProperty(lists.podcasts, mediaPropertyId),
  };
}

/** The bookmarks whose linked media item belongs to the property described by `members`. */
export function bookmarksForMediaProperty(
  bookmarks: Bookmark[],
  members: MediaPropertyMemberIds,
): Bookmark[] {
  return bookmarks.filter(b =>
    (b.movieId != null && members.movieIds.has(b.movieId))
    || (b.tvShowId != null && members.tvShowIds.has(b.tvShowId))
    || (b.episodeId != null && members.episodeIds.has(b.episodeId))
    || (b.albumId != null && members.albumIds.has(b.albumId))
    || (b.trackId != null && members.trackIds.has(b.trackId))
    || (b.bookId != null && members.bookIds.has(b.bookId))
    || (b.podcastId != null && members.podcastIds.has(b.podcastId)));
}
