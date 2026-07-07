import type { PodcastLinkProvider } from "@eesimple/types";

import { PODCAST_LINK_PROVIDER_LABELS, PODCAST_LINK_PROVIDERS } from "@eesimple/types";

/** The per-service link fields carried on a bookmark's own promoted podcast identity (see #1070). */
export interface PodcastLinkFields {
  feedUrl: string | null;
  itunesUrl: string | null;
  spotifyUrl: string | null;
  pocketCastsUrl: string | null;
  defaultLinkProvider: PodcastLinkProvider | null;
}

/** The stored page URL for a given provider on a podcast, or null when unset. */
export function podcastLinkUrl(podcast: PodcastLinkFields, provider: PodcastLinkProvider): string | null {
  switch (provider) {
    case "feed": return podcast.feedUrl;
    case "itunes": return podcast.itunesUrl;
    case "spotify": return podcast.spotifyUrl;
    case "pocketCasts": return podcast.pocketCastsUrl;
  }
}

/** A resolved external link for a podcast. */
export interface PodcastResolvedLink {
  provider: PodcastLinkProvider;
  url: string;
  label: string;
}

/**
 * The podcast's effective external link — the `defaultLinkProvider`'s URL when set and present, else the
 * first available provider in canonical order. `null` when the podcast has no service link at all.
 */
export function resolvePodcastDefaultLink(podcast: PodcastLinkFields): PodcastResolvedLink | null {
  const preferred = podcast.defaultLinkProvider;
  const order: PodcastLinkProvider[] = preferred
    ? [preferred, ...PODCAST_LINK_PROVIDERS.filter(provider => provider !== preferred)]
    : [...PODCAST_LINK_PROVIDERS];
  for (const provider of order) {
    const url = podcastLinkUrl(podcast, provider);
    if (url != null) {
      return {
        provider,
        url,
        label: PODCAST_LINK_PROVIDER_LABELS[provider],
      };
    }
  }
  return null;
}
