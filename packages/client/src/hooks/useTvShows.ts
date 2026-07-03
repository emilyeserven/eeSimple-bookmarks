import type { CreateTvShowInput, UpdateTvShowInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { tvShowsApi } from "../lib/api/taxonomies";

const TV_SHOWS_KEY = ["tv-shows"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useTvShows() {
  return useQuery({
    queryKey: TV_SHOWS_KEY,
    queryFn: tvShowsApi.list,
  });
}

/** Look up a single TV show by its slug from the cached list. */
export function useTvShowBySlug(slug: string) {
  const query = useTvShows();
  return {
    ...query,
    tvShow: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on TV-show definitions. */
function useInvalidateTvShowConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: TV_SHOWS_KEY,
    });
    // A show's media-property link ripples into media-property counts.
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    // A show rename/delete surfaces on any bookmark linked to it.
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateTvShow() {
  const invalidate = useInvalidateTvShowConsumers();
  return useMutation({
    mutationFn: (input: CreateTvShowInput) => tvShowsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTvShow() {
  const invalidate = useInvalidateTvShowConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateTvShowInput; }) => tvShowsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTvShow() {
  const invalidate = useInvalidateTvShowConsumers();
  return useMutation({
    mutationFn: (id: string) => tvShowsApi.remove(id),
    onSuccess: invalidate,
  });
}

/** One-click "Autofetch from Plex": poster + Wikipedia links + native/romanized names. */
export function useTvShowPlexAutofetch() {
  const invalidate = useInvalidateTvShowConsumers();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tvShowsApi.autofetch(id),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: ["tvShow-images"],
      });
    },
  });
}

export function useBulkDeleteTvShows() {
  return useBulkDeleteEntity(tvShowsApi.bulkDelete, useInvalidateTvShowConsumers());
}
