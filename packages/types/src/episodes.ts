/**
 * An Episode in the "Episodes" taxonomy. Plex-backed like a Movie, plus an optional parent TV Show
 * (`tvShowId`) that is auto-linked from Plex when it already exists. Bookmarks link to an Episode via
 * `bookmark.episodeId`.
 */

import type { EntityName } from "./entityNames.js";

export interface Episode {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** Multilingual names for this episode, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this episode belongs to. */
  mediaPropertyId: string | null;
  /** Parent TV Show this episode belongs to, or null. */
  tvShowId: string | null;
  /** Plex rating key (Settings → Connectors) this episode maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `episode`) for the deep-link label. */
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
  /** ISO-8601 timestamp of when the episode was created. */
  createdAt: string;
  /** Number of bookmarks linked to this episode (populated by list endpoints). */
  bookmarkCount?: number;
  /** Main artwork image URL (from the taxonomy-image gallery), or null when none is set. */
  imageUrl: string | null;
}

/** Payload for creating an episode. */
export interface CreateEpisodeInput {
  name: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  tvShowId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

/** Payload for updating an episode (rename, reorder, re-link Plex/media property/parent). */
export interface UpdateEpisodeInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  tvShowId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}
