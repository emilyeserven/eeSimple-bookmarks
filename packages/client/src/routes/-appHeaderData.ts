import type { PinContext } from "@/components/HeaderPinButton";
import type { EntityName } from "@eesimple/types";

import { useTaxonomyNameMap } from "./-appHeaderNames";

import { useCategoryBySlug } from "@/hooks/useCategories";
import { useMediaTypeBySlug } from "@/hooks/useMediaTypes";
import { useWebsiteBySlug } from "@/hooks/useWebsites";
import { useYouTubeChannelBySlug } from "@/hooks/useYouTubeChannels";

/** Slug at `index` when on `prefix`'s pages, else "" (so the by-slug hooks short-circuit). */
export function slugFor(
  pathname: string,
  pathParts: string[],
  prefix: string,
  index: number,
): string {
  return pathname === prefix || pathname.startsWith(`${prefix}/`) ? (pathParts[index] ?? "") : "";
}

/** A resolved entity's real name plus its multilingual names, for its `List → Name` crumb. */
export interface TaxonomyName {
  name?: string;
  names?: EntityName[];
}

/** The entities the header may resolve from a taxonomy detail route, plus their crumb-name map. */
export interface TaxonomyCrumbData {
  taxonomyNames: Record<string, TaxonomyName | undefined>;
  category: { id: string;
    name: string; } | undefined;
  website: { id: string;
    siteName: string; } | undefined;
  mediaType: { id: string;
    name: string; } | undefined;
  channel: { id: string;
    name: string; } | undefined;
}

/**
 * Resolves every slug-routed taxonomy entity's real name (for its `List → Name` crumb) plus the few
 * raw entities the header's pin / add-child controls need. Each by-slug hook short-circuits on an
 * empty slug, so only the entity whose page is active actually looks anything up. Bundling the nine
 * hooks here keeps the `AppHeader` component itself under the complexity cap.
 */
export function useTaxonomyCrumbData(pathname: string, pathParts: string[]): TaxonomyCrumbData {
  const {
    category,
  } = useCategoryBySlug(slugFor(pathname, pathParts, "/categories", 1));
  const {
    website,
  } = useWebsiteBySlug(slugFor(pathname, pathParts, "/taxonomies/websites", 2));
  const {
    mediaType,
  } = useMediaTypeBySlug(slugFor(pathname, pathParts, "/taxonomies/media-types", 2));
  const {
    channel,
  } = useYouTubeChannelBySlug(slugFor(pathname, pathParts, "/taxonomies/youtube-channels", 2));
  // The remaining entities are *named* only (no raw record needed) — resolved in a sibling hook to
  // keep this module's dependency count low. We own `slugFor`, so we resolve their slugs here.
  const namedTaxonomies = useTaxonomyNameMap({
    newsletter: slugFor(pathname, pathParts, "/taxonomies/newsletters", 2),
    person: slugFor(pathname, pathParts, "/taxonomies/people", 2),
    group: slugFor(pathname, pathParts, "/taxonomies/groups", 2),
    groupType: slugFor(pathname, pathParts, "/taxonomies/group-types", 2),
    genreMood: slugFor(pathname, pathParts, "/taxonomies/genres-moods", 2),
    language: slugFor(pathname, pathParts, "/taxonomies/languages", 2),
    placeType: slugFor(pathname, pathParts, "/taxonomies/place-types", 2),
    propertyGroup: slugFor(pathname, pathParts, "/taxonomies/property-groups", 2),
    relationshipType: slugFor(pathname, pathParts, "/taxonomies/relationship-types", 2),
    property: slugFor(pathname, pathParts, "/custom-properties", 1),
    autofill: slugFor(pathname, pathParts, "/autofill", 1),
    importRule: slugFor(pathname, pathParts, "/import-rules", 1),
    savedFilter: slugFor(pathname, pathParts, "/saved-filters", 1),
    cardDisplayRule: slugFor(pathname, pathParts, "/card-display-rules", 1),
  });

  return {
    taxonomyNames: {
      "/categories": {
        name: category?.name,
        names: category?.names,
      },
      "/taxonomies/websites": {
        name: website?.siteName,
      },
      "/taxonomies/media-types": {
        name: mediaType?.name,
      },
      "/taxonomies/youtube-channels": {
        name: channel?.name,
      },
      ...namedTaxonomies,
    },
    category,
    website,
    mediaType,
    channel,
  };
}

/** The candidate entities for the header's "pin this page" control (at most one is set). */
export interface PinCandidates {
  category?: { id: string;
    name: string; };
  website?: { id: string;
    siteName: string; };
  mediaType?: { id: string;
    name: string; };
  channel?: { id: string;
    name: string; };
  currentTag?: { id: string;
    name: string; };
}

/**
 * The pinnable entity for the current detail page, if any. Each by-slug hook is non-null only on its
 * own detail page, so at most one branch matches; tag uses the resolved ancestor chain's leaf.
 */
export function resolvePinContext(c: PinCandidates): PinContext | null {
  if (c.category) return {
    entityType: "category",
    entityId: c.category.id,
    label: c.category.name,
  };
  if (c.website) return {
    entityType: "website",
    entityId: c.website.id,
    label: c.website.siteName,
  };
  if (c.mediaType) return {
    entityType: "media-type",
    entityId: c.mediaType.id,
    label: c.mediaType.name,
  };
  if (c.channel) return {
    entityType: "youtube-channel",
    entityId: c.channel.id,
    label: c.channel.name,
  };
  if (c.currentTag) return {
    entityType: "tag",
    entityId: c.currentTag.id,
    label: c.currentTag.name,
  };
  return null;
}

/** The header's "quick-create a child of this entity" descriptor for hierarchy taxonomies. */
export type AddChild = { kind: "tag" | "mediaType";
  parentId: string | undefined; } | null;

/**
 * On a hierarchy-taxonomy detail page (Tags / Media Types), the header offers a button that
 * quick-creates a child of the current entity. The parent id is the already-resolved entity.
 */
export function resolveAddChild(args: {
  pathParts: string[];
  tagParentId: string | undefined;
  mediaTypeId: string | undefined;
}): AddChild {
  const {
    pathParts, tagParentId, mediaTypeId,
  } = args;
  const isTagDetail = pathParts[0] === "tags" && pathParts.length >= 2;
  if (isTagDetail) return {
    kind: "tag",
    parentId: tagParentId,
  };

  const isMediaTypeDetail = pathParts[0] === "taxonomies"
    && pathParts[1] === "media-types"
    && pathParts.length >= 3;
  if (isMediaTypeDetail) return {
    kind: "mediaType",
    parentId: mediaTypeId,
  };

  return null;
}
