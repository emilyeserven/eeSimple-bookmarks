import type { EntityName } from "./entityNames.js";
import type { LabeledWebsite } from "./labeledWebsites.js";
import type { LanguageUsage } from "./languageUsages.js";

/**
 * A TV Show in the "TV Shows" taxonomy. Bookmarks link to a TV Show (via `bookmark.tvShowId`) rather
 * than a live Plex item; the TV Show carries the Plex linkage so poster/deep-link features resolve the
 * Plex rating key from it. A TV Show may optionally belong to a Media Property (franchise/IP grouping).
 */
export interface TvShow {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** Multilingual names for this show, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this show belongs to. */
  mediaPropertyId: string | null;
  /** Plex rating key (Settings → Connectors) this show maps to, or null if not linked. */
  plexRatingKey: string | null;
  /** Denormalized Plex item type (e.g. `show`) for the deep-link label. */
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
  /** ISO-8601 timestamp of when the show was created. */
  createdAt: string;
  /** Number of bookmarks linked to this show (populated by list endpoints). */
  bookmarkCount?: number;
  /** Languages associated with this show, each qualified by a usage level. Populated by get endpoints. */
  languageUsages?: LanguageUsage[];
  /** Main artwork image URL (from the taxonomy-image gallery), or null when none is set. */
  imageUrl: string | null;
  /** Labeled websites/links for this show (freeform label + URL, optionally a Websites-taxonomy ref). */
  labeledWebsites: LabeledWebsite[];
}

/** Payload for creating a TV show. */
export interface CreateTvShowInput {
  name: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

/** Payload for updating a TV show (rename, reorder, re-link Plex/media property). */
export interface UpdateTvShowInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
  /** Labeled websites/links. Replaces the full list; omit to leave unchanged. */
  labeledWebsites?: LabeledWebsite[];
}
