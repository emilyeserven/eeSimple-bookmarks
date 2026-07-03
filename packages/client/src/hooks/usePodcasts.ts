import type { PodcastResolvedLink } from "../lib/podcastLinks";
import type { Bookmark, CreatePodcastInput, PodcastSearchProvider, UpdatePodcastInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { podcastsApi } from "../lib/api/taxonomies";
import { resolvePodcastDefaultLink } from "../lib/podcastLinks";

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
 * The external link a bookmark's linked podcast points at — its `defaultLinkProvider`'s URL, else the
 * first available service. Resolved client-side from the cached podcasts list (podcast links are public
 * URLs, no connector gating). `null` when the bookmark isn't linked to a podcast or none has a URL.
 */
export function useBookmarkPodcastLink(bookmark: Bookmark): PodcastResolvedLink | null {
  const {
    data: podcasts,
  } = usePodcasts();
  if (bookmark.podcastId == null) return null;
  const podcast = (podcasts ?? []).find(item => item.id === bookmark.podcastId);
  return podcast ? resolvePodcastDefaultLink(podcast) : null;
}

/**
 * Keyless podcast search for the create/edit picker; `provider` selects the directory (Apple Podcasts
 * or Pocket Casts). Gated on a non-empty term so an empty search box makes no request.
 */
export function usePodcastSearch(term: string, provider: PodcastSearchProvider = "itunes") {
  return useQuery({
    queryKey: ["podcasts", "search", provider, term],
    queryFn: () => podcastsApi.search(term, provider),
    enabled: term.trim().length > 0,
  });
}

/**
 * Resolve a pasted podcast URL (an Apple Podcasts show page, or a raw RSS/XML feed URL) for the
 * search picker's "paste a URL" mode. Gated on a non-empty URL; a 404 (no podcast found) surfaces
 * as `query.isError` rather than being swallowed.
 */
export function usePodcastUrlResolve(url: string) {
  return useQuery({
    queryKey: ["podcasts", "resolve-url", url],
    queryFn: () => podcastsApi.resolveUrl(url),
    enabled: url.trim().length > 0,
    retry: false,
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
