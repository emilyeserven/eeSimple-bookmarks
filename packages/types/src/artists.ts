/**
 * An Artist in the "Artists" taxonomy. Plex-backed like a Movie. Associated with Albums many-to-many
 * (an artist has many albums). Bookmarks link to an Artist via `bookmark.artistId`.
 */
export interface Artist {
  id: string;
  /** Display name. Unique. */
  name: string;
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
  /** Optional release year surfaced by the Plex search. */
  year: number | null;
  /** ISO-8601 timestamp of when the artist was created. */
  createdAt: string;
  /** Number of bookmarks linked to this artist (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating an artist. */
export interface CreateArtistInput {
  name: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  albumIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  year?: number | null;
}

/** Payload for updating an artist (rename, reorder, re-link Plex/media property, set albums). */
export interface UpdateArtistInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  albumIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  year?: number | null;
}
