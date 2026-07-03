import type { CreateTrackInput, UpdateTrackInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { tracksApi } from "../lib/api/taxonomies";

const TRACKS_KEY = ["tracks"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useTracks() {
  return useQuery({
    queryKey: TRACKS_KEY,
    queryFn: tracksApi.list,
  });
}

/** Look up a single track by its slug from the cached list. */
export function useTrackBySlug(slug: string) {
  const query = useTracks();
  return {
    ...query,
    track: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on track definitions. */
function useInvalidateTrackConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: TRACKS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateTrack() {
  const invalidate = useInvalidateTrackConsumers();
  return useMutation({
    mutationFn: (input: CreateTrackInput) => tracksApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTrack() {
  const invalidate = useInvalidateTrackConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateTrackInput; }) => tracksApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTrack() {
  const invalidate = useInvalidateTrackConsumers();
  return useMutation({
    mutationFn: (id: string) => tracksApi.remove(id),
    onSuccess: invalidate,
  });
}

/** One-click "Autofetch from Plex": poster + Wikipedia links + native/romanized names. */
export function useTrackPlexAutofetch() {
  const invalidate = useInvalidateTrackConsumers();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tracksApi.autofetch(id),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: ["track-images"],
      });
    },
  });
}

export function useBulkDeleteTracks() {
  return useBulkDeleteEntity(tracksApi.bulkDelete, useInvalidateTrackConsumers());
}
