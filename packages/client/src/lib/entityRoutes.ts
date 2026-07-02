import type { TaxonomyEntity } from "./breadcrumbSwitcherTypes";

import { AUTHOR_ROUTE } from "../entities/author";
import { CATEGORY_ROUTE } from "../entities/category";
import { MEDIA_TYPE_ROUTE } from "../entities/mediaType";
import { NEWSLETTER_ROUTE } from "../entities/newsletter";
import { PLACE_TYPE_ROUTE } from "../entities/placeType";
import { CUSTOM_PROPERTY_ROUTE } from "../entities/property";
import { PROPERTY_GROUP_ROUTE } from "../entities/propertyGroup";
import { PUBLISHER_ROUTE } from "../entities/publisher";
import { RELATIONSHIP_TYPE_ROUTE } from "../entities/relationshipType";
import { SAVED_FILTER_ROUTE } from "../entities/savedFilter";
import { WEBSITE_ROUTE } from "../entities/website";
import { YOUTUBE_CHANNEL_ROUTE } from "../entities/youtubeChannel";

/** Stable identifier for each slug-routed entity (used by the CMD+K registry and pin mapping). */
export type EntityRouteKind
  = | "category"
    | "tag"
    | "website"
    | "media-type"
    | "location"
    | "place-type"
    | "youtube-channel"
    | "newsletter"
    | "author"
    | "publisher"
    | "property-group"
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
  {
    kind: "tag",
    prefix: "/tags",
    slugIndex: 1,
    listLabel: "Tags",
    singular: "Tag",
    flatCrumbs: false,
  },
  WEBSITE_ROUTE,
  MEDIA_TYPE_ROUTE,
  {
    kind: "location",
    prefix: "/taxonomies/locations",
    slugIndex: 2,
    listLabel: "Locations",
    singular: "Location",
    flatCrumbs: false,
  },
  PLACE_TYPE_ROUTE,
  YOUTUBE_CHANNEL_ROUTE,
  NEWSLETTER_ROUTE,
  AUTHOR_ROUTE,
  PUBLISHER_ROUTE,
  PROPERTY_GROUP_ROUTE,
  RELATIONSHIP_TYPE_ROUTE,
  CUSTOM_PROPERTY_ROUTE,
  {
    kind: "autofill",
    prefix: "/autofill",
    slugIndex: 1,
    listLabel: "Autofill Rules",
    singular: "Rule",
    switcher: "autofill",
    flatCrumbs: true,
  },
  {
    kind: "import-rule",
    prefix: "/import-rules",
    slugIndex: 1,
    listLabel: "Import Rules",
    singular: "Rule",
    switcher: "import-rule",
    flatCrumbs: true,
  },
  SAVED_FILTER_ROUTE,
  {
    kind: "card-display-rule",
    prefix: "/card-display-rules",
    slugIndex: 1,
    listLabel: "Card Display Rules",
    singular: "Card Display Rule",
    flatCrumbs: true,
  },
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
