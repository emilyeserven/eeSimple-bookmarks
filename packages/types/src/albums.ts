/**
 * An Album in the "Albums" taxonomy. Plex-backed like a Movie. Associated with Artists many-to-many
 * (an album has many artists). Bookmarks link to an Album via `bookmark.albumId`.
 */
export interface Album {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this album belongs to. */
  mediaPropertyId: string | null;
  /** Ids of the artists credited on this album (many-to-many). */
  artistIds: string[];
  /** Plex rating key (Settings → Connectors) this album maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `album`) for the deep-link label. */
  plexItemType: string | null;
  /** Optional release year surfaced by the Plex search. */
  year: number | null;
  /** ISO-8601 timestamp of when the album was created. */
  createdAt: string;
  /** Number of bookmarks linked to this album (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating an album. */
export interface CreateAlbumInput {
  name: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  artistIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  year?: number | null;
}

/** Payload for updating an album (rename, reorder, re-link Plex/media property, set artists). */
export interface UpdateAlbumInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  artistIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  year?: number | null;
}
