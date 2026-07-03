/**
 * An Artist in the "Artists" taxonomy. Plex-backed like a Movie. Associated with Albums many-to-many
 * (an artist has many albums). Bookmarks link to an Artist via `bookmark.artistId`.
 */
export interface Artist {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** Optional romanized form of the name, matched by search and shown de-emphasized when present. */
  romanizedName?: string | null;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this artist belongs to. */
  mediaPropertyId: string | null;
  /** Ids of the albums this artist is credited on (many-to-many). */
  albumIds: string[];
  /** Plex rating key (Settings → Connectors) this artist maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `artist`) for the deep-link label. */
  plexItemType: string | null;
  /** Display title of the linked Plex item, denormalized at link time. */
  plexItemTitle: string | null;
  /** Optional release year surfaced by the Plex search. */
  year: number | null;
  /** Wikidata QID resolved by "Autofetch from Plex"; reused to re-resolve links. */
  wikidataId: string | null;
  /** English Wikipedia article URL, or null. */
  wikipediaLinkEn: string | null;
  /** Local-language Wikipedia article URL, or null. */
  wikipediaLinkLocal: string | null;
  /** ISO-8601 timestamp of when the artist was created. */
  createdAt: string;
  /** Number of bookmarks linked to this artist (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating an artist. */
export interface CreateArtistInput {
  name: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  albumIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

/** Payload for updating an artist (rename, reorder, re-link Plex/media property, set albums). */
export interface UpdateArtistInput {
  name?: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  albumIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}
