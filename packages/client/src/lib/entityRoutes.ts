import type { TaxonomyEntity } from "./breadcrumbSwitcherTypes";

import { ENTITY_DESCRIPTORS } from "../entities/registry";

/** Stable identifier for each slug-routed entity (used by the CMD+K registry and pin mapping). */
export type EntityRouteKind
  = | "category"
    | "tag"
    | "website"
    | "media-type"
    | "genre-mood"
    | "language"
    | "location"
    | "place-type"
    | "location-relation"
    | "youtube-channel"
    | "newsletter"
    | "person"
    | "group"
    | "group-type"
    | "relationship-type"
    | "custom-property"
    | "autofill"
    | "import-rule"
    | "saved-filter"
    | "card-display-rule";

/**
 * Route data for one slug-routed entity — the single source the breadcrumb `TAXONOMY_DESCRIPTORS`
 * (`routes/-appHeaderCrumbs.tsx`) and the CMD+K entity registry (`lib/entityPaletteRegistry.ts`)
 * derive from. Adding a slug-routed entity means building its `EntityDescriptor` and adding one line
 * to `entities/registry.ts` (see the `add-entity` skill).
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

/**
 * Derived from the `ENTITY_DESCRIPTORS` registry — the match order follows that object's
 * `Object.values` insertion order (its key order is load-bearing for exactly this reason).
 */
export const ENTITY_ROUTES: readonly EntityRoute[] = Object.values(ENTITY_DESCRIPTORS).map(
  d => d.route,
);

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
