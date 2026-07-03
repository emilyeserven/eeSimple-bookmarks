/**
 * An Album in the "Albums" taxonomy. Plex-backed like a Movie. Credited to People (individual creators)
 * and Groups (group creators) many-to-many. Bookmarks link to an Album via `bookmark.albumId`.
 */
export interface Album {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** Optional romanized form of the name, matched by search and shown de-emphasized when present. */
  romanizedName?: string | null;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this album belongs to. */
  mediaPropertyId: string | null;
  /** Ids of the People (individual creators) credited on this album (many-to-many). */
  personIds: string[];
  /** Ids of the Groups (group creators) credited on this album (many-to-many). */
  groupIds: string[];
  /** Plex rating key (Settings → Connectors) this album maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `album`) for the deep-link label. */
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
  /** ISO-8601 timestamp of when the album was created. */
  createdAt: string;
  /** Number of bookmarks linked to this album (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating an album. */
export interface CreateAlbumInput {
  name: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  personIds?: string[];
  groupIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

/** Payload for updating an album (rename, reorder, re-link Plex/media property, set credits). */
export interface UpdateAlbumInput {
  name?: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  personIds?: string[];
  groupIds?: string[];
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}
