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
 * A Podcast in the "Podcasts" taxonomy — the eighth Media Property a bookmark can link to (via
 * `bookmark.podcastId`). Unlike the Plex-backed siblings, a Podcast is sourced keylessly from its
 * public RSS/XML feed and/or Apple Podcasts (iTunes) so its title/author/artwork/description can be
 * autofilled and re-synced. It also stores its page URL on other listening services (Spotify,
 * Pocket Casts) — cross-resolved from the feed where possible, pasted for Spotify — and a
 * `defaultLinkProvider` picking which one it links out to. A Podcast may optionally belong to a Media
 * Property (franchise/IP grouping).
 */
export interface Podcast {
  id: string;
  /** Display name — the show title. Unique. */
  name: string;
  /** Optional romanized form of the name, matched by search and shown de-emphasized when present. */
  romanizedName?: string | null;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this podcast belongs to. */
  mediaPropertyId: string | null;
  /** Canonical RSS/XML feed URL — the source of truth for "Sync from source", or null when unset. */
  feedUrl: string | null;
  /** Apple Podcasts collection id (from the iTunes search picker), or null when not linked. */
  itunesId: number | null;
  /** Apple Podcasts page URL (for a "View on Apple Podcasts" link-out), or null. */
  itunesUrl: string | null;
  /** Spotify show page URL (manual paste — Spotify has no keyless search), or null. */
  spotifyUrl: string | null;
  /** Pocket Casts podcast uuid (from the Pocket Casts search/cross-resolve), or null. */
  pocketCastsUuid: string | null;
  /** Pocket Casts share page URL (`https://pca.st/podcast/<uuid>`), or null. */
  pocketCastsUrl: string | null;
  /** Which service this podcast links out to by default, or null to fall back to the first available. */
  defaultLinkProvider: PodcastLinkProvider | null;
  /** People (individuals) credited as authors/hosts of this podcast. */
  personIds: string[];
  /** Groups (organizations/networks) credited as authors/hosts of this podcast. */
  groupIds: string[];
  /** Podcast description scraped from the feed, or null. */
  description: string | null;
  /** ISO-8601 timestamp of when the podcast was created. */
  createdAt: string;
  /** Number of bookmarks linked to this podcast (populated by list endpoints). */
  bookmarkCount?: number;
  /** Main artwork image URL (from the taxonomy-image gallery), or null when none is set. */
  imageUrl: string | null;
}

/** Payload for creating a podcast. */
export interface CreatePodcastInput {
  name: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  feedUrl?: string | null;
  itunesId?: number | null;
  itunesUrl?: string | null;
  spotifyUrl?: string | null;
  pocketCastsUuid?: string | null;
  pocketCastsUrl?: string | null;
  defaultLinkProvider?: PodcastLinkProvider | null;
  /** People (individuals) credited as authors/hosts. Replaces the full set when present. */
  personIds?: string[];
  /** Groups (organizations/networks) credited as authors/hosts. Replaces the full set when present. */
  groupIds?: string[];
  description?: string | null;
}

/** Payload for updating a podcast (rename, reorder, re-link feed/iTunes/media property). */
export interface UpdatePodcastInput {
  name?: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  feedUrl?: string | null;
  itunesId?: number | null;
  itunesUrl?: string | null;
  spotifyUrl?: string | null;
  pocketCastsUuid?: string | null;
  pocketCastsUrl?: string | null;
  defaultLinkProvider?: PodcastLinkProvider | null;
  /** People (individuals) credited as authors/hosts. Replaces the full set when present. */
  personIds?: string[];
  /** Groups (organizations/networks) credited as authors/hosts. Replaces the full set when present. */
  groupIds?: string[];
  description?: string | null;
}

/**
 * A single podcast returned by a keyless search provider (Apple Podcasts / Pocket Casts) — the shape
 * the create/edit search picker binds to. Selecting one fills the podcast's name/author/feed and links
 * the searched provider's id/url; the other services are backfilled by the cross-resolver.
 */
export interface PodcastSearchResult {
  /** Which directory this hit came from. */
  provider: PodcastSearchProvider;
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
