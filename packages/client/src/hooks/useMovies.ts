import type { Bookmark, CreateMovieInput, UpdateMovieInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAlbums } from "./useAlbums";
import { useArtists } from "./useArtists";
import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { useEpisodes } from "./useEpisodes";
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

/** Find the linked row's `plexRatingKey` in one cached list, given the bookmark's FK for it. */
function ratingKeyFrom(
  fkId: string | null,
  items: readonly { id: string;
    plexRatingKey: string | null; }[] | undefined,
): string | null {
  if (!fkId) return null;
  return (items ?? []).find(item => item.id === fkId)?.plexRatingKey ?? null;
}

/**
 * The effective Plex rating key for a bookmark: the linked Movie / TV Show / Episode / Album / Artist
 * / Track's `plexRatingKey` when one is linked and carries it, else the bookmark's legacy
 * `plexRatingKey`. Powers the "Use Plex poster" gate now that Plex-item selection flows through the
 * Plex-backed taxonomies (mirrors the middleware's `resolveBookmarkPlexRatingKey`). Returns `null`
 * when none is available.
 */
export function useBookmarkPlexRatingKey(bookmark: Bookmark): string | null {
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
    data: artists,
  } = useArtists();
  const {
    data: tracks,
  } = useTracks();
  return ratingKeyFrom(bookmark.movieId, movies)
    ?? ratingKeyFrom(bookmark.tvShowId, tvShows)
    ?? ratingKeyFrom(bookmark.episodeId, episodes)
    ?? ratingKeyFrom(bookmark.albumId, albums)
    ?? ratingKeyFrom(bookmark.artistId, artists)
    ?? ratingKeyFrom(bookmark.trackId, tracks)
    ?? bookmark.plexRatingKey
    ?? null;
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
