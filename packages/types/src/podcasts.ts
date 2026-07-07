/**
 * The directories a podcast can carry a "website link" to. `feed` is the raw RSS/XML feed; the other
 * three are the show's page on a listening service. One is chosen as the podcast's `defaultLinkProvider`
 * — the service its detail page and the `podcastLink` bookmark-card field link out to. Add a provider
 * in exactly one place: this tuple + its label below.
 */
export const PODCAST_LINK_PROVIDERS = ["feed", "itunes", "spotify", "pocketCasts"] as const;
export type PodcastLinkProvider = typeof PODCAST_LINK_PROVIDERS[number];

/** Human labels for each link provider (exhaustive over {@link PODCAST_LINK_PROVIDERS}). */
export const PODCAST_LINK_PROVIDER_LABELS: Record<PodcastLinkProvider, string> = {
  feed: "RSS Feed",
  itunes: "Apple Podcasts",
  spotify: "Spotify",
  pocketCasts: "Pocket Casts",
};

/**
 * The subset of providers that can be *searched* keylessly (the search-picker's provider selector).
 * Spotify is intentionally excluded — its Web API needs OAuth, so a Spotify link is manual-paste only.
 */
export const PODCAST_SEARCH_PROVIDERS = ["itunes", "pocketCasts"] as const;
export type PodcastSearchProvider = typeof PODCAST_SEARCH_PROVIDERS[number];

/**
 * A single podcast returned by a keyless search provider (Apple Podcasts / Pocket Casts) or resolved
 * directly from a pasted URL — the shape the create/edit search picker binds to. Selecting one fills
 * the podcast's name/author/feed and links the searched provider's id/url; the other services are
 * backfilled by the cross-resolver.
 */
export interface PodcastSearchResult {
  /** Which directory this hit came from, or `"feed"` when resolved from a pasted RSS/XML feed URL. */
  provider: PodcastSearchProvider | "feed";
  /** Apple Podcasts collection id, or null for a non-iTunes hit. */
  itunesId: number | null;
  /** Pocket Casts podcast uuid, or null for a non-Pocket-Casts hit. */
  pocketCastsUuid: string | null;
  /** Show title. */
  name: string;
  /** Author/host name, or null. */
  author: string | null;
  /** Canonical RSS/XML feed URL, or null when the provider has none on file. */
  feedUrl: string | null;
  /** Apple Podcasts page URL, or null. */
  itunesUrl: string | null;
  /** Pocket Casts share page URL, or null. */
  pocketCastsUrl: string | null;
  /** Highest-resolution artwork URL the provider returned, or null. */
  artworkUrl: string | null;
}

/**
 * The per-service page links cross-resolved for a podcast by matching its RSS feed URL across the
 * keyless directories (Apple + Pocket Casts). Spotify is never here — it has no keyless lookup. Every
 * field is best-effort/nullable. Returned by `GET /api/podcasts/:id/resolve-links` and carried on
 * `PodcastFeedResult` for the "Sync from source" modal.
 */
export interface PodcastProviderLinks {
  /** Apple Podcasts collection id, when matched. */
  itunesId: number | null;
  /** Apple Podcasts page URL, when matched. */
  itunesUrl: string | null;
  /** Pocket Casts podcast uuid, when matched. */
  pocketCastsUuid: string | null;
  /** Pocket Casts share page URL, when matched. */
  pocketCastsUrl: string | null;
}

/**
 * Normalized metadata resolved from a podcast's RSS/XML feed (or an iTunes lookup that resolves to the
 * feed). Powers the "Sync from source" review modal (`GET /api/podcasts/:id/feed-preview`) and the
 * post-select autofill. Never persisted directly — the client stages the picked rows.
 */
export interface PodcastFeedResult {
  /** Show title from the feed, or null when unreadable. */
  title: string | null;
  /** Author/host from `itunes:author`/`managingEditor`, or null. */
  author: string | null;
  /** Feed description/summary, or null. */
  description: string | null;
  /** Artwork image URL (`itunes:image`/`<image><url>`), or null. */
  imageUrl: string | null;
  /** The feed URL the metadata was read from (echoed back), or null. */
  feedUrl: string | null;
  /** Apple Podcasts collection id, when the resolution started from iTunes, else null. */
  itunesId: number | null;
  /** Apple Podcasts page URL, when known, else null. */
  itunesUrl: string | null;
  /** Detected content language, normalized to an ISO 639-1 code where known, or null. */
  languageCode: string | null;
  /** Cross-resolved per-service page links (Apple/Pocket Casts) matched from the feed, or null. */
  providerLinks?: PodcastProviderLinks | null;
}
