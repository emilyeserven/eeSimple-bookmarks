import type { TaxonomyEntity } from "./breadcrumbSwitcherTypes";

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

/** Hoisted so `entities/publisher.ts`'s `EntityDescriptor` can reference this entry by identity. */
export const PUBLISHER_ROUTE: EntityRoute = {
  kind: "publisher",
  prefix: "/taxonomies/publishers",
  slugIndex: 2,
  listLabel: "Publishers",
  singular: "Publisher",
  flatCrumbs: true,
};

/** Hoisted so `entities/author.tsx`'s `EntityDescriptor` can reference this entry by identity. */
export const AUTHOR_ROUTE: EntityRoute = {
  kind: "author",
  prefix: "/taxonomies/authors",
  slugIndex: 2,
  listLabel: "Authors",
  singular: "Author",
  flatCrumbs: true,
};

export const ENTITY_ROUTES: readonly EntityRoute[] = [
  {
    kind: "category",
    prefix: "/categories",
    slugIndex: 1,
    listLabel: "Categories",
    singular: "Category",
    switcher: "category",
    flatCrumbs: true,
  },
  {
    kind: "tag",
    prefix: "/tags",
    slugIndex: 1,
    listLabel: "Tags",
    singular: "Tag",
    flatCrumbs: false,
  },
  {
    kind: "website",
    prefix: "/taxonomies/websites",
    slugIndex: 2,
    listLabel: "Websites",
    singular: "Website",
    switcher: "website",
    flatCrumbs: true,
  },
  {
    kind: "media-type",
    prefix: "/taxonomies/media-types",
    slugIndex: 2,
    listLabel: "Media Types",
    singular: "Media Type",
    flatCrumbs: true,
  },
  {
    kind: "location",
    prefix: "/taxonomies/locations",
    slugIndex: 2,
    listLabel: "Locations",
    singular: "Location",
    flatCrumbs: false,
  },
  {
    kind: "place-type",
    prefix: "/taxonomies/place-types",
    slugIndex: 2,
    listLabel: "Place Types",
    singular: "Place Type",
    flatCrumbs: true,
  },
  {
    kind: "youtube-channel",
    prefix: "/taxonomies/youtube-channels",
    slugIndex: 2,
    listLabel: "YouTube Channels",
    singular: "Channel",
    switcher: "youtube-channel",
    flatCrumbs: true,
  },
  {
    kind: "newsletter",
    prefix: "/taxonomies/newsletters",
    slugIndex: 2,
    listLabel: "Imports",
    singular: "Import",
    flatCrumbs: true,
  },
  AUTHOR_ROUTE,
  PUBLISHER_ROUTE,
  {
    kind: "property-group",
    prefix: "/taxonomies/property-groups",
    slugIndex: 2,
    listLabel: "Property Groups",
    singular: "Property Group",
    switcher: "property-group",
    flatCrumbs: true,
  },
  {
    kind: "relationship-type",
    prefix: "/taxonomies/relationship-types",
    slugIndex: 2,
    listLabel: "Relationship Types",
    singular: "Relationship Type",
    flatCrumbs: true,
  },
  {
    kind: "custom-property",
    prefix: "/custom-properties",
    slugIndex: 1,
    listLabel: "Custom Properties",
    singular: "Custom Property",
    switcher: "custom-property",
    flatCrumbs: true,
  },
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
  {
    kind: "saved-filter",
    prefix: "/saved-filters",
    slugIndex: 1,
    listLabel: "Saved Filters",
    singular: "Saved Filter",
    flatCrumbs: true,
  },
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
