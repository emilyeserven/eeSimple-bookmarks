import type { PodcastDiffCurrent } from "../lib/syncSources/podcastDiff";
import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

import { useQuery } from "@tanstack/react-query";

import { podcastsApi } from "../lib/api/taxonomies";
import { buildPodcastDiff } from "../lib/syncSources/podcastDiff";

/** Reads a string ref, treating missing/blank/non-string as null. */
function strRef(refs: SyncProvider["refs"], key: string): string | null {
  const value = refs?.[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Fetches a podcast's current source metadata for the sync modal: the RSS/iTunes-resolved
 * title/author/description + artwork (from the resolve-only `…/feed-preview` endpoint), built into a
 * current-vs-source diff. Only runs while the sync modal is open.
 */
export function usePodcastSyncSource(provider: SyncProvider, enabled: boolean): SyncSourceFetch {
  const query = useQuery({
    queryKey: ["podcast-feed-preview", provider.entityId],
    queryFn: () => podcastsApi.feedPreview(provider.entityId),
    enabled,
    staleTime: 60_000,
  });

  const current: PodcastDiffCurrent = {
    name: strRef(provider.refs, "currentName"),
    description: strRef(provider.refs, "currentDescription"),
    imageUrl: strRef(provider.refs, "currentImageUrl"),
    itunesUrl: strRef(provider.refs, "currentItunesUrl"),
    pocketCastsUrl: strRef(provider.refs, "currentPocketCastsUrl"),
  };

  if (query.isPending && enabled) {
    return {
      diff: null,
      isLoading: true,
      error: null,
    };
  }
  if (query.isError) {
    return {
      diff: null,
      isLoading: false,
      error: "Couldn't reach the podcast source. Check the feed URL and try again.",
    };
  }

  const preview = query.data;
  return {
    diff: buildPodcastDiff(current, {
      title: preview?.title ?? null,
      description: preview?.description ?? null,
      imageUrl: preview?.imageUrl ?? null,
      itunesUrl: preview?.providerLinks?.itunesUrl ?? preview?.itunesUrl ?? null,
      pocketCastsUrl: preview?.providerLinks?.pocketCastsUrl ?? null,
    }, "Podcast feed"),
    isLoading: false,
    error: null,
  };
}
