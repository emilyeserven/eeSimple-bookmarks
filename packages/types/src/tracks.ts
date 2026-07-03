/**
 * A Track in the "Tracks" taxonomy. Plex-backed like a Movie, plus an optional parent Album
 * (`albumId`) that is auto-linked from Plex when it already exists. Bookmarks link to a Track via
 * `bookmark.trackId`.
 */
export interface Track {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** Optional romanized form of the name, matched by search and shown de-emphasized when present. */
  romanizedName?: string | null;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this track belongs to. */
  mediaPropertyId: string | null;
  /** Parent Album this track belongs to, or null. */
  albumId: string | null;
  /** Plex rating key (Settings → Connectors) this track maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `track`) for the deep-link label. */
  plexItemType: string | null;
  /** Display title of the linked Plex item, denormalized at link time. */
  plexItemTitle: string | null;
  /** Optional release year surfaced by the Plex search. */
  year: number | null;
  /** ISO-8601 timestamp of when the track was created. */
  createdAt: string;
  /** Number of bookmarks linked to this track (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating a track. */
export interface CreateTrackInput {
  name: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  albumId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
}

/** Payload for updating a track (rename, reorder, re-link Plex/media property/parent). */
export interface UpdateTrackInput {
  name?: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  albumId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
}
