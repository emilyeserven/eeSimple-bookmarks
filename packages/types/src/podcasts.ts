/**
 * A Podcast in the "Podcasts" taxonomy — the eighth Media Property a bookmark can link to (via
 * `bookmark.podcastId`). Unlike the Plex-backed siblings, a Podcast is sourced keylessly from its
 * public RSS/XML feed and/or Apple Podcasts (iTunes) so its title/author/artwork/description can be
 * autofilled and re-synced. A Podcast may optionally belong to a Media Property (franchise/IP grouping).
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
  /** Denormalized podcast author/host string, or null. */
  author: string | null;
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
  author?: string | null;
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
  author?: string | null;
  description?: string | null;
}

/**
 * A single podcast returned by the keyless Apple Podcasts (iTunes) search — the shape the create/edit
 * search picker binds to. Selecting one fills the podcast's name/author/feed and links the iTunes id.
 */
export interface PodcastSearchResult {
  /** Apple Podcasts collection id. */
  itunesId: number;
  /** Show title. */
  name: string;
  /** Author/host name, or null. */
  author: string | null;
  /** Canonical RSS/XML feed URL, or null when Apple has none on file. */
  feedUrl: string | null;
  /** Apple Podcasts page URL. */
  itunesUrl: string | null;
  /** Highest-resolution artwork URL Apple returned, or null. */
  artworkUrl: string | null;
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
}
