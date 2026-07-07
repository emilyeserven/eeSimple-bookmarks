import type { TaxonomyName } from "./-appHeaderData";
import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";
import type { BreadcrumbSegment } from "@/components/header/HeaderBreadcrumbs";
import type { EntityRoute } from "@/lib/entityRoutes";
import type { EntityName, LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { slugFor, useTaxonomyCrumbData } from "./-appHeaderData";

import { useBookmark } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useLocationTree } from "@/hooks/useLocations";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import i18n from "@/i18n";
import { ENTITY_ROUTES } from "@/lib/entityRoutes";
import { findAncestorPath } from "@/lib/tagTree";

/** Labels for path segments whose human form differs from a plain title-cased slug. */
function labelOverrides(): Record<string, string> {
  return {
    "youtube-channels": i18n.t("YouTube Channels"),
    "genres-moods": i18n.t("Genres & Moods"),
    "autofill": i18n.t("Autofill Rules"),
    "import-rules": i18n.t("Import Rules"),
    "saved-filters": i18n.t("Saved Filters"),
    "ai-summarization": i18n.t("AI Summarization"),
    "bookmark-add": i18n.t("Bookmark Add Form"),
  };
}

/** Title-case a slug segment: `shortened-links` → `Shortened Links`. */
function titleCaseSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Human label for a single path segment — a settings sub-page, an edit tab, etc. */
function crumbLabel(segment: string): string {
  return labelOverrides()[segment] ?? titleCaseSegment(segment);
}

interface TaxonomyDescriptor {
  /** URL prefix that owns this entity's listing + detail/edit pages. */
  prefix: string;
  /** Listing-page label, e.g. `Custom Properties`. */
  listLabel: string;
  /** Placeholder shown only while the entity name is still loading. */
  singular: string;
  /** Index of the entity slug among the path's non-empty segments. */
  slugIndex: number;
  /**
   * Builds the name crumb's sibling-switcher spec from the current slug. Omit to leave the name crumb
   * a plain (non-switching) crumb. (Media Types are intentionally absent — they get a tree ancestor
   * chain via `mediaTypeCrumbs`, not the flat name-crumb switcher.)
   */
  makeSwitcher?: (slug: string) => SwitcherSpec;
}

/** The name-crumb switcher builder for an entity route's `switcher` declaration. */
function makeSwitcherFor(route: EntityRoute): ((slug: string) => SwitcherSpec) | undefined {
  const entity = route.switcher;
  if (!entity) return undefined;
  if (entity === "category") {
    return slug => ({
      kind: "category",
      currentSlug: slug,
    });
  }
  return slug => ({
    kind: "taxonomy",
    entity,
    currentSlug: slug,
  });
}

// Every slug-routed entity whose breadcrumb is `List → Name → [Section]`, derived from the shared
// ENTITY_ROUTES data (tree/bespoke-crumb taxonomies — Tags, Locations — declare `flatCrumbs: false`
// there and stay out; Bookmarks are bespoke below). Adding a slug-routed entity means adding its
// ENTITY_ROUTES entry AND resolving its name in `AppHeader` — see the `add-entity` skill.
const TAXONOMY_DESCRIPTORS: readonly TaxonomyDescriptor[] = ENTITY_ROUTES
  .filter(route => route.flatCrumbs)
  .map(route => ({
    prefix: route.prefix,
    listLabel: route.listLabel,
    singular: route.singular,
    slugIndex: route.slugIndex,
    makeSwitcher: makeSwitcherFor(route),
  }));

/**
 * Breadcrumbs for a slug-routed taxonomy entity: `List(link) → Name` on the detail/view tabs, and
 * `List(link) → Name(link → view) → Section` on edit tabs. `resolved` is the entity's real name +
 * optional multilingual names; the descriptor's `singular` is only a brief loading placeholder.
 */
function taxonomyCrumbs(
  pathname: string,
  descriptor: TaxonomyDescriptor,
  resolved?: TaxonomyName,
  editTab?: string,
): BreadcrumbSegment[] {
  const {
    prefix, listLabel, singular, slugIndex,
  } = descriptor;
  // Listing page.
  if (pathname === prefix) return [{
    label: listLabel,
  }];
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts[slugIndex] ?? "";
  const listCrumb: BreadcrumbSegment = {
    label: listLabel,
    href: prefix,
  };
  const name = resolved?.name;
  const itemLabel = name ?? singular;
  const names = name ? resolved?.names : undefined;
  // The bare detail/browse index and every `_view` tab stop at the name. The name crumb gets a
  // sibling switcher (when the descriptor defines one and the real name has resolved).
  if (parts[slugIndex + 1] !== "edit") {
    const nameCrumb: BreadcrumbSegment = {
      label: itemLabel,
      names,
      switcher: name ? descriptor.makeSwitcher?.(slug) : undefined,
    };
    return [listCrumb, nameCrumb];
  }
  // Edit tabs: link the name back to its view, end on the section/tab label. The tab comes from the
  // path segment for still-path-routed entities, else from the `?tab=` search param (entities migrated
  // to the unified `…/edit?tab=` route — see `EntityEditView`).
  const tab = parts[slugIndex + 2] ?? editTab;
  return [listCrumb, {
    label: itemLabel,
    names,
    href: `${prefix}/${slug}/info`,
    truncatable: true,
  }, {
    label: tab ? crumbLabel(tab) : i18n.t("Edit"),
  }];
}

function settingsCrumbs(pathname: string): BreadcrumbSegment[] {
  const rest = pathname.slice("/settings".length).replace(/^\//, "");
  if (!rest) return [{
    label: i18n.t("Settings"),
  }];
  // One crumb per path segment (e.g. /settings/display/general → Settings → Display → General),
  // each non-last crumb linking to its cumulative path.
  const segments = rest.split("/").filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [{
    label: i18n.t("Settings"),
    href: "/settings",
  }];
  let acc = "/settings";
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    crumbs.push({
      label: crumbLabel(segment),
      ...(index < segments.length - 1
        ? {
          href: acc,
        }
        : {}),
    });
  });
  return crumbs;
}

interface TreeTaxonomyConfig {
  listLabel: string;
  /** URL prefix that is both the listing href and the per-node view prefix (e.g. `/tags`). */
  viewPrefix: string;
  tree: "tag" | "media-type" | "location";
  /** Index of the entity slug among the path's non-empty segments. */
  slugIndex: number;
  /** Placeholder shown before the ancestor chain resolves. */
  singular: string;
}

/** Same-parent sibling switcher for a node in a tree taxonomy (its tier / its parent's children). */
function treeSiblingSwitcher(node: TagNode | MediaTypeNode | LocationNode, tree: "tag" | "media-type" | "location"): SwitcherSpec {
  return {
    kind: "treeSiblings",
    tree,
    parentId: node.parentId ?? null,
    currentSlug: node.slug,
  };
}

/**
 * Breadcrumbs for a tree (hierarchical) taxonomy with an ancestor chain. On the view chain each
 * ancestor links to its own page AND carries a same-parent sibling switcher; the leaf is the current
 * page with a switcher. On the edit chain ancestors link to their `…/info` views and the trail
 * ends on `Edit` (no switchers). Shared by Tags and Media Types.
 */
function treeTaxonomyCrumbs(
  pathname: string,
  ancestors: (TagNode | MediaTypeNode | LocationNode)[] | undefined,
  config: TreeTaxonomyConfig,
): BreadcrumbSegment[] {
  const {
    listLabel, viewPrefix, tree, slugIndex, singular,
  } = config;
  const parts = pathname.split("/").filter(Boolean);
  // Listing page (no slug segment yet).
  if (parts.length <= slugIndex) return [{
    label: listLabel,
  }];
  const listCrumb: BreadcrumbSegment = {
    label: listLabel,
    href: viewPrefix,
  };
  const slug = parts[slugIndex] ?? "";
  const isEdit = parts[slugIndex + 1] === "edit";
  // Ancestor chain not resolved yet — generic placeholder, no switcher.
  if (!ancestors?.length) {
    const fallback: BreadcrumbSegment = isEdit
      ? {
        label: singular,
        href: `${viewPrefix}/${slug}/info`,
      }
      : {
        label: singular,
      };
    return isEdit
      ? [listCrumb, fallback, {
        label: i18n.t("Edit"),
      }]
      : [listCrumb, fallback];
  }
  // Edit chain: ancestors (incl. current) link to their `/info` view; end on `Edit`. No switchers.
  if (isEdit) {
    return [
      listCrumb,
      ...ancestors.map((node): BreadcrumbSegment => ({
        label: node.name,
        names: node.names,
        href: `${viewPrefix}/${node.slug}/info`,
        truncatable: true,
      })),
      {
        label: i18n.t("Edit"),
      },
    ];
  }
  // View chain: each ancestor links to its page; every crumb switches among its same-parent siblings.
  const parents = ancestors.slice(0, -1);
  const current = ancestors[ancestors.length - 1];
  return [
    listCrumb,
    ...parents.map((node): BreadcrumbSegment => ({
      label: node.name,
      names: node.names,
      href: `${viewPrefix}/${node.slug}`,
      switcher: treeSiblingSwitcher(node, tree),
      truncatable: true,
    })),
    {
      label: current.name,
      names: current.names,
      switcher: treeSiblingSwitcher(current, tree),
    },
  ];
}

function tagCrumbs(pathname: string, tagAncestors?: TagNode[]): BreadcrumbSegment[] {
  return treeTaxonomyCrumbs(pathname, tagAncestors, {
    listLabel: i18n.t("Tags"),
    viewPrefix: "/tags",
    tree: "tag",
    slugIndex: 1,
    singular: i18n.t("Tag"),
  });
}

function mediaTypeCrumbs(
  pathname: string,
  mediaTypeAncestors?: MediaTypeNode[],
): BreadcrumbSegment[] {
  return treeTaxonomyCrumbs(pathname, mediaTypeAncestors, {
    listLabel: i18n.t("Media Types"),
    viewPrefix: "/taxonomies/media-types",
    tree: "media-type",
    slugIndex: 2,
    singular: i18n.t("Media Type"),
  });
}

function locationCrumbs(
  pathname: string,
  locationAncestors?: LocationNode[],
): BreadcrumbSegment[] {
  // The create page is a `New` leaf, not a slug-resolved entity.
  if (pathname === "/taxonomies/locations/new") {
    return [
      {
        label: i18n.t("Locations"),
        href: "/taxonomies/locations",
      },
      {
        label: i18n.t("New"),
      },
    ];
  }
  return treeTaxonomyCrumbs(pathname, locationAncestors, {
    listLabel: i18n.t("Locations"),
    viewPrefix: "/taxonomies/locations",
    tree: "location",
    slugIndex: 2,
    singular: i18n.t("Location"),
  });
}

interface BookmarkCrumbData {
  id: string;
  title: string;
  names?: EntityName[];
  categoryId?: string;
  categoryName?: string;
  categoryNames?: EntityName[];
  categorySlug?: string;
}

function bookmarkCrumbs(pathname: string, data?: BookmarkCrumbData): BreadcrumbSegment[] {
  const listCrumb: BreadcrumbSegment = {
    label: i18n.t("Bookmarks"),
    href: "/bookmarks",
  };
  // The category crumb keeps its own-page link AND switches among all categories.
  const catSwitcher: SwitcherSpec | undefined = data?.categorySlug
    ? {
      kind: "category",
      currentSlug: data.categorySlug,
    }
    : undefined;
  const catCrumb: BreadcrumbSegment = data?.categorySlug
    ? {
      label: data.categoryName ?? i18n.t("Category"),
      names: data.categoryName ? data.categoryNames : undefined,
      href: `/categories/${data.categorySlug}`,
      switcher: catSwitcher,
      truncatable: true,
    }
    : {
      label: data?.categoryName ?? i18n.t("Category"),
      names: data?.categoryName ? data?.categoryNames : undefined,
    };
  const titleCrumb: BreadcrumbSegment = {
    label: data?.title ?? i18n.t("Bookmark"),
    names: data?.title ? data?.names : undefined,
  };

  const isEdit = pathname.includes("/edit");
  if (isEdit) {
    // link the title back to the detail view (no switcher on the edit chain)
    const detailHref = pathname.replace(/\/edit.*$/, "");
    return [listCrumb, catCrumb, {
      ...titleCrumb,
      href: detailHref,
      truncatable: true,
    }, {
      label: i18n.t("Edit"),
    }];
  }
  // Detail view: the title switches among bookmarks in the same category.
  const titleSwitcher: SwitcherSpec | undefined = data?.id && data.categoryId
    ? {
      kind: "bookmark",
      categoryId: data.categoryId,
      currentId: data.id,
    }
    : undefined;
  return [listCrumb, catCrumb, {
    ...titleCrumb,
    switcher: titleSwitcher,
  }];
}

interface BreadcrumbContext {
  tagAncestors?: TagNode[];
  mediaTypeAncestors?: MediaTypeNode[];
  locationAncestors?: LocationNode[];
  bookmarkData?: BookmarkCrumbData;
  /** Resolved entity name (+ optional multilingual names) keyed by `TaxonomyDescriptor.prefix`. */
  taxonomyNames?: Record<string, TaxonomyName | undefined>;
  /** The `?tab=` search param, used to label the edit crumb for entities on the unified edit route. */
  editTab?: string;
}

/** Derive breadcrumb segments from a pathname. */
function breadcrumbsForPath(pathname: string, ctx: BreadcrumbContext): BreadcrumbSegment[] {
  if (pathname === "/") return [{
    label: i18n.t("Home"),
  }];
  if (pathname === "/bookmarks") return [{
    label: i18n.t("Bookmarks"),
  }];
  if (pathname.startsWith("/bookmarks/"))
    return bookmarkCrumbs(pathname, ctx.bookmarkData);
  if (pathname === "/inbox") return [{
    label: i18n.t("Inbox"),
  }];
  if (pathname === "/inbox/new")
    return [{
      label: i18n.t("Inbox"),
      href: "/inbox",
    }, {
      label: i18n.t("Add import"),
    }];
  if (pathname === "/card-display-rules") return [{
    label: i18n.t("Card Display Rules"),
  }];
  if (pathname.startsWith("/settings")) return settingsCrumbs(pathname);
  if (pathname === "/tags" || pathname.startsWith("/tags/")) return tagCrumbs(pathname, ctx.tagAncestors);
  // Media-type detail/edit pages get a tree ancestor chain (the bare listing stays on the descriptor).
  if (pathname.startsWith("/taxonomies/media-types/"))
    return mediaTypeCrumbs(pathname, ctx.mediaTypeAncestors);
  // Location detail/edit pages get a tree ancestor chain (the bare listing stays on the descriptor).
  if (pathname.startsWith("/taxonomies/locations/"))
    return locationCrumbs(pathname, ctx.locationAncestors);

  const descriptor = TAXONOMY_DESCRIPTORS.find(
    d => pathname === d.prefix || pathname.startsWith(`${d.prefix}/`),
  );
  if (descriptor)
    return taxonomyCrumbs(pathname, descriptor, ctx.taxonomyNames?.[descriptor.prefix], ctx.editTab);

  return [{
    label: i18n.t("eeSimple Bookmarks"),
  }];
}

/** Everything the header needs to render the crumb trail: the resolved segments plus the few raw
 * entities the pin / add-child controls reuse. Bundling the breadcrumb data-resolution hooks here
 * keeps the `AppHeader` component itself thin and under the complexity cap. */
export interface HeaderBreadcrumbData {
  crumbs: BreadcrumbSegment[];
  /** Bookmark id when on a bookmark detail/edit route, else "" — reused by the toolbar. */
  bookmarkId: string;
  category: { id: string;
    name: string; } | undefined;
  website: { id: string;
    siteName: string; } | undefined;
  mediaType: { id: string;
    name: string; } | undefined;
  channel: { id: string;
    name: string; } | undefined;
  currentTag: TagNode | undefined;
}

/**
 * Resolves the breadcrumb trail for the current path. Pulls every taxonomy name plus the tag /
 * media-type / location ancestor chains and the bookmark's category + title, then runs the pure
 * `breadcrumbsForPath` deriver. Also returns the raw entities the header's pin / add-child controls
 * consume so the component doesn't re-resolve them.
 */
export function useHeaderBreadcrumbs(
  pathname: string,
  pathParts: string[],
  editTab?: string,
): HeaderBreadcrumbData {
  // Resolve each taxonomy entity's real name for its `List → Name` crumb (and the few raw entities
  // the pin / add-child controls need).
  const {
    taxonomyNames, category, website, mediaType, channel,
  } = useTaxonomyCrumbData(pathname, pathParts);

  // Tag breadcrumbs carry the ancestor chain.
  const tagSlug = slugFor(pathname, pathParts, "/tags", 1);
  const {
    data: tagTree,
  } = useTagTree();
  const tagAncestors = tagSlug && tagTree
    ? (findAncestorPath(tagTree, tagSlug) ?? undefined)
    : undefined;

  // Media-type breadcrumbs carry the ancestor chain too (one level deep), resolved from the tree.
  const mediaTypeSlug = slugFor(pathname, pathParts, "/taxonomies/media-types", 2);
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const mediaTypeAncestors = mediaTypeSlug && mediaTypeTree
    ? (findAncestorPath(mediaTypeTree, mediaTypeSlug) ?? undefined)
    : undefined;

  // Location breadcrumbs carry the ancestor chain (unlimited nesting), resolved from the tree.
  const locationSlug = slugFor(pathname, pathParts, "/taxonomies/locations", 2);
  const {
    data: locationTree,
  } = useLocationTree();
  const locationAncestors = locationSlug && locationTree
    ? (findAncestorPath(locationTree, locationSlug) ?? undefined)
    : undefined;

  // Bookmark breadcrumbs carry the bookmark's category + title.
  const bookmarkId = slugFor(pathname, pathParts, "/bookmarks", 1);
  const {
    data: bookmarkForCrumb,
  } = useBookmark(bookmarkId);
  const {
    data: allCategories,
  } = useCategories();
  const bookmarkCategory = bookmarkForCrumb && allCategories
    ? allCategories.find(c => c.id === bookmarkForCrumb.categoryId)
    : undefined;
  const bookmarkData: BookmarkCrumbData | undefined = bookmarkForCrumb
    ? {
      id: bookmarkForCrumb.id,
      title: bookmarkForCrumb.title,
      names: bookmarkForCrumb.names,
      categoryId: bookmarkForCrumb.categoryId,
      categoryName: bookmarkCategory?.name,
      categoryNames: bookmarkCategory?.names,
      categorySlug: bookmarkCategory?.slug,
    }
    : undefined;

  const crumbs = breadcrumbsForPath(pathname, {
    tagAncestors,
    mediaTypeAncestors,
    locationAncestors,
    bookmarkData,
    taxonomyNames,
    editTab,
  });

  return {
    crumbs,
    bookmarkId,
    category,
    website,
    mediaType,
    channel,
    currentTag: tagAncestors?.[tagAncestors.length - 1],
  };
}
