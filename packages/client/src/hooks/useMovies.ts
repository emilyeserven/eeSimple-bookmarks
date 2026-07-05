import type { Bookmark, CreateMovieInput, UpdateMovieInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAlbums } from "./useAlbums";
import { useBooks } from "./useBooks";
import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { useEpisodes } from "./useEpisodes";
import { usePodcasts } from "./usePodcasts";
import { useTracks } from "./useTracks";
import { useTvShows } from "./useTvShows";
import { moviesApi } from "../lib/api/taxonomies";

const MOVIES_KEY = ["movies"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useMovies() {
  return useQuery({
    queryKey: MOVIES_KEY,
    queryFn: moviesApi.list,
  });
}

/** Look up a single movie by its slug from the cached list. */
export function useMovieBySlug(slug: string) {
  const query = useMovies();
  return {
    ...query,
    movie: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** The minimal shape a Plex-backed taxonomy row contributes to the FK scan below. */
interface PlexTaxoRow {
  id: string;
  name: string;
  plexRatingKey: string | null;
}

/**
 * Find the linked row in one cached list, given the bookmark's FK for it — but only when that row
 * actually carries a `plexRatingKey`. A found-but-unlinked-to-Plex row is treated as no match so the
 * `??` scan falls through to the next FK (and eventually the bookmark's legacy columns), matching
 * the original priority-chain behavior.
 */
function linkedRowFrom(
  fkId: string | null,
  items: readonly PlexTaxoRow[] | undefined,
): PlexTaxoRow | null {
  if (!fkId) return null;
  const row = (items ?? []).find(item => item.id === fkId);
  return row?.plexRatingKey ? row : null;
}

/** The Plex linkage resolved for a bookmark's detail/deep-link/poster display. */
export interface BookmarkPlexLink {
  ratingKey: string;
  title: string;
}

/**
 * The effective Plex linkage for a bookmark: the linked Movie / TV Show / Episode / Album /
 * Track's `plexRatingKey` + name when one is linked and carries it, else the bookmark's legacy
 * `plexRatingKey`/`plexItemTitle`. Powers the "View on Plex" link-outs now that Plex-item selection
 * flows through the Plex-backed taxonomies (mirrors the middleware's `resolveBookmarkPlexRatingKey`).
 * Returns `null` when neither is available.
 */
export function useBookmarkPlexLink(bookmark: Bookmark): BookmarkPlexLink | null {
  const {
    t,
  } = useTranslation();
  const {
    data: movies,
  } = useMovies();
  const {
    data: tvShows,
  } = useTvShows();
  const {
    data: episodes,
  } = useEpisodes();
  const {
    data: albums,
  } = useAlbums();
  const {
    data: tracks,
  } = useTracks();
  const linked = linkedRowFrom(bookmark.movieId, movies)
    ?? linkedRowFrom(bookmark.tvShowId, tvShows)
    ?? linkedRowFrom(bookmark.episodeId, episodes)
    ?? linkedRowFrom(bookmark.albumId, albums)
    ?? linkedRowFrom(bookmark.trackId, tracks);
  if (linked?.plexRatingKey) {
    return {
      ratingKey: linked.plexRatingKey,
      title: linked.name,
    };
  }
  if (bookmark.plexRatingKey !== null) {
    return {
      ratingKey: bookmark.plexRatingKey,
      title: bookmark.plexItemTitle ?? t("Item {{ratingKey}}", {
        ratingKey: bookmark.plexRatingKey,
      }),
    };
  }
  return null;
}

/**
 * The effective Plex rating key for a bookmark — the string-only projection of
 * {@link useBookmarkPlexLink}. Powers the "Use Plex poster" gate.
 */
export function useBookmarkPlexRatingKey(bookmark: Bookmark): string | null {
  return useBookmarkPlexLink(bookmark)?.ratingKey ?? null;
}

/** The seven Media Property taxonomies a bookmark can link to via one of its FKs. */
export type MediaTaxonomyKind = "book" | "podcast" | "movie" | "tvShow" | "episode" | "album" | "track";

/** The minimal shape a Media Property taxonomy row contributes to the bookmark detail link. */
interface MediaTaxoRow {
  id: string;
  name: string;
  slug: string;
}

/** The linked Media Property taxonomy row a bookmark's detail view links out to. */
export interface BookmarkMediaTaxonomyLink {
  kind: MediaTaxonomyKind;
  title: string;
  slug: string;
}

function mediaTaxoLinkFrom(
  kind: MediaTaxonomyKind,
  fkId: string | null,
  items: readonly MediaTaxoRow[] | undefined,
): BookmarkMediaTaxonomyLink | null {
  if (!fkId) return null;
  const row = (items ?? []).find(item => item.id === fkId);
  return row
    ? {
      kind,
      title: row.name,
      slug: row.slug,
    }
    : null;
}

/**
 * The Media Property taxonomy a bookmark links to via its `bookId`/`podcastId`/`movieId`/
 * `tvShowId`/`episodeId`/`albumId`/`trackId` FK (exactly one is ever set), independent of whether
 * that row also carries a Plex link — unlike {@link useBookmarkPlexLink}, Books and Podcasts (which
 * are never Plex-backed) are included here. Powers the bookmark detail page's linked-media-taxonomy
 * row, which links into the app's own taxonomy term page rather than out to Plex. Returns `null`
 * when no media-taxonomy FK is set.
 */
export function useBookmarkMediaTaxonomyLink(bookmark: Bookmark): BookmarkMediaTaxonomyLink | null {
  const {
    data: books,
  } = useBooks();
  const {
    data: podcasts,
  } = usePodcasts();
  const {
    data: movies,
  } = useMovies();
  const {
    data: tvShows,
  } = useTvShows();
  const {
    data: episodes,
  } = useEpisodes();
  const {
    data: albums,
  } = useAlbums();
  const {
    data: tracks,
  } = useTracks();
  return mediaTaxoLinkFrom("book", bookmark.bookId, books)
    ?? mediaTaxoLinkFrom("podcast", bookmark.podcastId, podcasts)
    ?? mediaTaxoLinkFrom("movie", bookmark.movieId, movies)
    ?? mediaTaxoLinkFrom("tvShow", bookmark.tvShowId, tvShows)
    ?? mediaTaxoLinkFrom("episode", bookmark.episodeId, episodes)
    ?? mediaTaxoLinkFrom("album", bookmark.albumId, albums)
    ?? mediaTaxoLinkFrom("track", bookmark.trackId, tracks);
}

/** Invalidate every query whose rendering depends on movie definitions. */
function useInvalidateMovieConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: MOVIES_KEY,
    });
    // A movie's media-property link ripples into media-property counts.
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    // A movie rename/delete surfaces on any bookmark linked to it.
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateMovie() {
  const invalidate = useInvalidateMovieConsumers();
  return useMutation({
    mutationFn: (input: CreateMovieInput) => moviesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateMovie() {
  const invalidate = useInvalidateMovieConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateMovieInput; }) => moviesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMovie() {
  const invalidate = useInvalidateMovieConsumers();
  return useMutation({
    mutationFn: (id: string) => moviesApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteMovies() {
  return useBulkDeleteEntity(moviesApi.bulkDelete, useInvalidateMovieConsumers());
}
