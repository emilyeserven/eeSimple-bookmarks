import type { TaxonomyEntity } from "./breadcrumbSwitcherTypes";

import { ALBUM_ROUTE } from "../entities/album";
import { ARTIST_ROUTE } from "../entities/artist";
import { AUTHOR_ROUTE } from "../entities/author";
import { AUTOFILL_ROUTE } from "../entities/autofillRule";
import { BOOK_ROUTE } from "../entities/book";
import { CARD_DISPLAY_RULE_ROUTE } from "../entities/cardDisplayRule";
import { CATEGORY_ROUTE } from "../entities/category";
import { EPISODE_ROUTE } from "../entities/episode";
import { IMPORT_RULE_ROUTE } from "../entities/importRule";
import { LANGUAGE_ROUTE } from "../entities/language";
import { LOCATION_ROUTE } from "../entities/location";
import { MEDIA_PROPERTY_ROUTE } from "../entities/mediaProperty";
import { MEDIA_TYPE_ROUTE } from "../entities/mediaType";
import { MOVIE_ROUTE } from "../entities/movie";
import { NEWSLETTER_ROUTE } from "../entities/newsletter";
import { PLACE_TYPE_ROUTE } from "../entities/placeType";
import { CUSTOM_PROPERTY_ROUTE } from "../entities/property";
import { PROPERTY_GROUP_ROUTE } from "../entities/propertyGroup";
import { PUBLISHER_ROUTE } from "../entities/publisher";
import { RELATIONSHIP_TYPE_ROUTE } from "../entities/relationshipType";
import { SAVED_FILTER_ROUTE } from "../entities/savedFilter";
import { TAG_ROUTE } from "../entities/tag";
import { TRACK_ROUTE } from "../entities/track";
import { TV_SHOW_ROUTE } from "../entities/tvShow";
import { WEBSITE_ROUTE } from "../entities/website";
import { YOUTUBE_CHANNEL_ROUTE } from "../entities/youtubeChannel";

/** Stable identifier for each slug-routed entity (used by the CMD+K registry and pin mapping). */
export type EntityRouteKind
  = | "category"
    | "tag"
    | "website"
    | "media-type"
    | "language"
    | "location"
    | "place-type"
    | "youtube-channel"
    | "newsletter"
    | "author"
    | "publisher"
    | "property-group"
    | "media-property"
    | "book"
    | "movie"
    | "tv-show"
    | "episode"
    | "album"
    | "artist"
    | "track"
    | "relationship-type"
    | "custom-property"
    | "autofill"
    | "import-rule"
    | "saved-filter"
    | "card-display-rule";

/**
 * Route data for one slug-routed entity — the single source the breadcrumb `TAXONOMY_DESCRIPTORS`
 * (`routes/-appHeaderCrumbs.tsx`) and the CMD+K entity registry (`lib/entityPaletteRegistry.ts`)
 * derive from. Adding a slug-routed entity means adding one entry here (see the `add-entity` skill).
 */
export interface EntityRoute {
  kind: EntityRouteKind;
  /** URL prefix that owns this entity's listing + detail/edit pages. */
  prefix: string;
  /** Index of the entity slug among the path's non-empty segments. */
  slugIndex: number;
  /** Listing-page label, e.g. `Custom Properties`. */
  listLabel: string;
  /** Singular label / loading placeholder, e.g. `Custom Property`. */
  singular: string;
  /**
   * Breadcrumb sibling-switcher for the name crumb: `"category"` uses the category switcher, a
   * `TaxonomyEntity` the flat taxonomy switcher; omit for a plain (non-switching) crumb.
   */
  switcher?: "category" | TaxonomyEntity;
  /**
   * `false` for taxonomies whose detail crumbs are tree/bespoke (Tags, Locations) — they are
   * excluded from the flat breadcrumb descriptors but still matchable by the CMD+K registry.
   */
  flatCrumbs: boolean;
}

export const ENTITY_ROUTES: readonly EntityRoute[] = [
  CATEGORY_ROUTE,
  TAG_ROUTE,
  WEBSITE_ROUTE,
  MEDIA_TYPE_ROUTE,
  LANGUAGE_ROUTE,
  LOCATION_ROUTE,
  PLACE_TYPE_ROUTE,
  YOUTUBE_CHANNEL_ROUTE,
  NEWSLETTER_ROUTE,
  AUTHOR_ROUTE,
  PUBLISHER_ROUTE,
  PROPERTY_GROUP_ROUTE,
  MEDIA_PROPERTY_ROUTE,
  BOOK_ROUTE,
  MOVIE_ROUTE,
  TV_SHOW_ROUTE,
  EPISODE_ROUTE,
  ALBUM_ROUTE,
  ARTIST_ROUTE,
  TRACK_ROUTE,
  RELATIONSHIP_TYPE_ROUTE,
  CUSTOM_PROPERTY_ROUTE,
  AUTOFILL_ROUTE,
  IMPORT_RULE_ROUTE,
  SAVED_FILTER_ROUTE,
  CARD_DISPLAY_RULE_ROUTE,
] as const;

/** Non-slug segments that can sit where an entity slug would (create pages, fixed sub-pages). */
const NON_SLUG_SEGMENTS = new Set(["new", "backfill"]);

/**
 * The entity route + slug for a detail/edit pathname, or `null` on listing/create/unrelated pages.
 */
export function matchEntityRoute(
  pathname: string,
): { route: EntityRoute;
  slug: string; } | null {
  for (const route of ENTITY_ROUTES) {
    if (pathname !== route.prefix && !pathname.startsWith(`${route.prefix}/`)) continue;
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[route.slugIndex];
    if (!slug || NON_SLUG_SEGMENTS.has(slug)) return null;
    return {
      route,
      slug,
    };
  }
  return null;
}
