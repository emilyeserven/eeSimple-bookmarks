import type { CreatePodcastInput, UpdatePodcastInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { podcastsApi } from "../lib/api/taxonomies";

const PODCASTS_KEY = ["podcasts"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function usePodcasts() {
  return useQuery({
    queryKey: PODCASTS_KEY,
    queryFn: podcastsApi.list,
  });
}

/** Look up a single podcast by its slug from the cached list. */
export function usePodcastBySlug(slug: string) {
  const query = usePodcasts();
  return {
    ...query,
    podcast: (query.data ?? []).find(item => item.slug === slug),
  };
}

/**
 * Keyless Apple Podcasts (iTunes) search for the create/edit picker. Gated on a non-empty term so an
 * empty search box makes no request.
 */
export function usePodcastSearch(term: string) {
  return useQuery({
    queryKey: ["podcasts", "search", term],
    queryFn: () => podcastsApi.search(term),
    enabled: term.trim().length > 0,
  });
}

/** Preview a podcast's feed metadata for the "Sync from source" review modal. Gated by `enabled`. */
export function usePodcastFeedPreview(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["podcasts", "feed-preview", id],
    queryFn: () => podcastsApi.feedPreview(id),
    enabled,
  });
}

/** Invalidate every query whose rendering depends on podcast definitions. */
function useInvalidatePodcastConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: PODCASTS_KEY,
    });
    // A podcast's media-property link ripples into media-property podcast counts.
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    // A podcast rename/delete surfaces on any bookmark linked to it.
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreatePodcast() {
  const invalidate = useInvalidatePodcastConsumers();
  return useMutation({
    mutationFn: (input: CreatePodcastInput) => podcastsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePodcast() {
  const invalidate = useInvalidatePodcastConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePodcastInput; }) => podcastsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePodcast() {
  const invalidate = useInvalidatePodcastConsumers();
  return useMutation({
    mutationFn: (id: string) => podcastsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeletePodcasts() {
  return useBulkDeleteEntity(podcastsApi.bulkDelete, useInvalidatePodcastConsumers());
}
