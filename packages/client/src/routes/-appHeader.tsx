import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";
import type { BreadcrumbSegment } from "@/components/header/HeaderBreadcrumbs";
import type { MediaTypeNode, TagNode } from "@eesimple/types";

import { Link, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { resolveAddChild, resolvePinContext, slugFor, useTaxonomyCrumbData } from "./-appHeaderData";

import { HeaderBreadcrumbs } from "@/components/header/HeaderBreadcrumbs";
import { HeaderToolbar } from "@/components/header/HeaderToolbar";
import { buildToolbarActions } from "@/components/header/toolbarActions";
import { ImportProgressIndicator } from "@/components/ImportProgressIndicator";
import { usePanelControls } from "@/components/panel/usePanelControls";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBookmark } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { findSettingsPage } from "@/lib/settingsPages";
import { findAncestorPath } from "@/lib/tagTree";
import { useUiStore } from "@/stores/uiStore";

/** Labels for path segments whose human form differs from a plain title-cased slug. */
const LABEL_OVERRIDES: Record<string, string> = {
  "youtube-channels": "YouTube Channels",
  "autofill": "Autofill Rules",
};

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
  return LABEL_OVERRIDES[segment] ?? titleCaseSegment(segment);
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

// Every slug-routed entity whose breadcrumb is `List → Name → [Section]`. Categories and Websites
// live here too — they share the exact same shape. (Tags and Bookmarks stay bespoke: tags carry an
// ancestor chain, bookmarks a category + title.) When you add a new slug-routed entity, add its
// descriptor here AND resolve its name in `AppHeader` below — see the `add-entity` skill.
const TAXONOMY_DESCRIPTORS: readonly TaxonomyDescriptor[] = [
  {
    prefix: "/categories",
    listLabel: "Categories",
    singular: "Category",
    slugIndex: 1,
    makeSwitcher: slug => ({
      kind: "category",
      currentSlug: slug,
    }),
  },
  {
    prefix: "/taxonomies/websites",
    listLabel: "Websites",
    singular: "Website",
    slugIndex: 2,
    makeSwitcher: slug => ({
      kind: "taxonomy",
      entity: "website",
      currentSlug: slug,
    }),
  },
  {
    prefix: "/taxonomies/media-types",
    listLabel: "Media Types",
    singular: "Media Type",
    slugIndex: 2,
  },
  {
    prefix: "/taxonomies/youtube-channels",
    listLabel: "YouTube Channels",
    singular: "Channel",
    slugIndex: 2,
    makeSwitcher: slug => ({
      kind: "taxonomy",
      entity: "youtube-channel",
      currentSlug: slug,
    }),
  },
  {
    prefix: "/taxonomies/newsletters",
    listLabel: "Newsletters",
    singular: "Newsletter",
    slugIndex: 2,
  },
  {
    prefix: "/taxonomies/property-groups",
    listLabel: "Property Groups",
    singular: "Property Group",
    slugIndex: 2,
    makeSwitcher: slug => ({
      kind: "taxonomy",
      entity: "property-group",
      currentSlug: slug,
    }),
  },
  {
    prefix: "/taxonomies/relationship-types",
    listLabel: "Relationship Types",
    singular: "Relationship Type",
    slugIndex: 2,
  },
  {
    prefix: "/custom-properties",
    listLabel: "Custom Properties",
    singular: "Custom Property",
    slugIndex: 1,
    makeSwitcher: slug => ({
      kind: "taxonomy",
      entity: "custom-property",
      currentSlug: slug,
    }),
  },
  {
    prefix: "/autofill",
    listLabel: "Autofill Rules",
    singular: "Rule",
    slugIndex: 1,
    makeSwitcher: slug => ({
      kind: "taxonomy",
      entity: "autofill",
      currentSlug: slug,
    }),
  },
] as const;

/**
 * Breadcrumbs for a slug-routed taxonomy entity: `List(link) → Name` on the detail/view tabs, and
 * `List(link) → Name(link → view) → Section` on edit tabs. `name` is the resolved entity name; the
 * descriptor's `singular` is only a brief loading placeholder.
 */
function taxonomyCrumbs(
  pathname: string,
  descriptor: TaxonomyDescriptor,
  name?: string,
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
  const itemLabel = name ?? singular;
  // The bare detail/browse index and every `_view` tab stop at the name. The name crumb gets a
  // sibling switcher (when the descriptor defines one and the real name has resolved).
  if (parts[slugIndex + 1] !== "edit") {
    const nameCrumb: BreadcrumbSegment = {
      label: itemLabel,
      switcher: name ? descriptor.makeSwitcher?.(slug) : undefined,
    };
    return [listCrumb, nameCrumb];
  }
  // Edit tabs: link the name back to its view, end on the section/tab label.
  const tab = parts[slugIndex + 2];
  return [listCrumb, {
    label: itemLabel,
    href: `${prefix}/${slug}/general`,
  }, {
    label: tab ? crumbLabel(tab) : "Edit",
  }];
}

function settingsCrumbs(pathname: string): BreadcrumbSegment[] {
  const rest = pathname.slice("/settings".length).replace(/^\//, "");
  if (!rest) return [{
    label: "Settings",
  }];
  const sub = rest.split("/")[0];
  return [{
    label: "Settings",
    href: "/settings",
  }, {
    label: crumbLabel(sub),
  }];
}

interface TreeTaxonomyConfig {
  listLabel: string;
  /** URL prefix that is both the listing href and the per-node view prefix (e.g. `/tags`). */
  viewPrefix: string;
  tree: "tag" | "media-type";
  /** Index of the entity slug among the path's non-empty segments. */
  slugIndex: number;
  /** Placeholder shown before the ancestor chain resolves. */
  singular: string;
}

/** Same-parent sibling switcher for a node in a tree taxonomy (its tier / its parent's children). */
function treeSiblingSwitcher(node: TagNode | MediaTypeNode, tree: "tag" | "media-type"): SwitcherSpec {
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
 * page with a switcher. On the edit chain ancestors link to their `…/general` views and the trail
 * ends on `Edit` (no switchers). Shared by Tags and Media Types.
 */
function treeTaxonomyCrumbs(
  pathname: string,
  ancestors: (TagNode | MediaTypeNode)[] | undefined,
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
        href: `${viewPrefix}/${slug}/general`,
      }
      : {
        label: singular,
      };
    return isEdit
      ? [listCrumb, fallback, {
        label: "Edit",
      }]
      : [listCrumb, fallback];
  }
  // Edit chain: ancestors (incl. current) link to their `/general` view; end on `Edit`. No switchers.
  if (isEdit) {
    return [
      listCrumb,
      ...ancestors.map((node): BreadcrumbSegment => ({
        label: node.name,
        href: `${viewPrefix}/${node.slug}/general`,
      })),
      {
        label: "Edit",
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
      href: `${viewPrefix}/${node.slug}`,
      switcher: treeSiblingSwitcher(node, tree),
    })),
    {
      label: current.name,
      switcher: treeSiblingSwitcher(current, tree),
    },
  ];
}

function tagCrumbs(pathname: string, tagAncestors?: TagNode[]): BreadcrumbSegment[] {
  return treeTaxonomyCrumbs(pathname, tagAncestors, {
    listLabel: "Tags",
    viewPrefix: "/tags",
    tree: "tag",
    slugIndex: 1,
    singular: "Tag",
  });
}

function mediaTypeCrumbs(
  pathname: string,
  mediaTypeAncestors?: MediaTypeNode[],
): BreadcrumbSegment[] {
  return treeTaxonomyCrumbs(pathname, mediaTypeAncestors, {
    listLabel: "Media Types",
    viewPrefix: "/taxonomies/media-types",
    tree: "media-type",
    slugIndex: 2,
    singular: "Media Type",
  });
}

interface BookmarkCrumbData {
  id: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
}

function bookmarkCrumbs(pathname: string, data?: BookmarkCrumbData): BreadcrumbSegment[] {
  const listCrumb: BreadcrumbSegment = {
    label: "Bookmarks",
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
      label: data.categoryName ?? "Category",
      href: `/categories/${data.categorySlug}`,
      switcher: catSwitcher,
    }
    : {
      label: data?.categoryName ?? "Category",
    };
  const titleCrumb: BreadcrumbSegment = {
    label: data?.title ?? "Bookmark",
  };

  const isEdit = pathname.includes("/edit");
  if (isEdit) {
    // link the title back to the detail view (no switcher on the edit chain)
    const detailHref = pathname.replace(/\/edit.*$/, "");
    return [listCrumb, catCrumb, {
      ...titleCrumb,
      href: detailHref,
    }, {
      label: "Edit",
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
  bookmarkData?: BookmarkCrumbData;
  /** Resolved entity name keyed by `TaxonomyDescriptor.prefix`. */
  taxonomyNames?: Record<string, string | undefined>;
}

/** Derive breadcrumb segments from a pathname. */
function breadcrumbsForPath(pathname: string, ctx: BreadcrumbContext): BreadcrumbSegment[] {
  if (pathname === "/") return [{
    label: "Home",
  }];
  if (pathname === "/bookmarks") return [{
    label: "Bookmarks",
  }];
  if (pathname.startsWith("/bookmarks/"))
    return bookmarkCrumbs(pathname, ctx.bookmarkData);
  if (pathname === "/inbox") return [{
    label: "Inbox",
  }];
  if (pathname === "/inbox/new")
    return [{
      label: "Inbox",
      href: "/inbox",
    }, {
      label: "Add import",
    }];
  if (pathname.startsWith("/settings")) return settingsCrumbs(pathname);
  if (pathname === "/tags" || pathname.startsWith("/tags/")) return tagCrumbs(pathname, ctx.tagAncestors);
  // Media-type detail/edit pages get a tree ancestor chain (the bare listing stays on the descriptor).
  if (pathname.startsWith("/taxonomies/media-types/"))
    return mediaTypeCrumbs(pathname, ctx.mediaTypeAncestors);

  const descriptor = TAXONOMY_DESCRIPTORS.find(
    d => pathname === d.prefix || pathname.startsWith(`${d.prefix}/`),
  );
  if (descriptor)
    return taxonomyCrumbs(pathname, descriptor, ctx.taxonomyNames?.[descriptor.prefix]);

  return [{
    label: "eeSimple Bookmarks",
  }];
}

/** Top app bar: sidebar trigger, breadcrumbs derived from the path, and the panel toggle. */
export function AppHeader() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });

  const pathParts = pathname.split("/").filter(Boolean);

  // Resolve each taxonomy entity's real name for its `List → Name` crumb (and the few raw entities
  // the pin / add-child controls need). Bundled into one hook to keep this component under the cap.
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
      categoryId: bookmarkForCrumb.categoryId,
      categoryName: bookmarkCategory?.name,
      categorySlug: bookmarkCategory?.slug,
    }
    : undefined;

  const crumbs = breadcrumbsForPath(pathname, {
    tagAncestors,
    mediaTypeAncestors,
    bookmarkData,
    taxonomyNames,
  });

  // Show Edit button in the header only on the bookmark detail page (not edit pages)
  const isBookmarkDetail = Boolean(bookmarkId)
    && !pathname.includes("/edit")
    && pathname.startsWith("/bookmarks/");

  // Settings (and settings-like management) pages get a header star to favorite the current page.
  const settingsPage = findSettingsPage(pathname);

  const currentTag = tagAncestors?.[tagAncestors.length - 1];
  const addChild = resolveAddChild({
    pathParts,
    tagParentId: currentTag?.id,
    mediaTypeId: mediaType?.id,
  });
  const pinContext = resolvePinContext({
    category,
    website,
    mediaType,
    channel,
    currentTag,
  });

  const {
    open,
  } = usePanelControls();

  const listingPage = useUiStore(state => state.listingPage);
  const headerSearchActive = useUiStore(state => state.headerSearchActive);

  // Right-side toolbar controls in canonical left→right order. The builder owns ordering and
  // conditional presence; `HeaderToolbar` renders the inline row on wide screens and collapses
  // everything but the panel toggle into a More menu on small screens.
  const toolbarActions = buildToolbarActions({
    pathParts,
    headerSearchActive,
    listingPage,
    isBookmarkDetail,
    bookmarkId,
    addChild,
    settingsPage,
    pinContext,
    openPanel: open,
  });

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-2 border-b px-4"
    >
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />
      <HeaderBreadcrumbs crumbs={crumbs} />
      <ImportProgressIndicator />
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="
          ml-auto
          md:hidden
        "
        aria-label="Settings"
      >
        <Link to="/settings">
          <Settings className="size-4" />
        </Link>
      </Button>
      <HeaderToolbar actions={toolbarActions} />
    </header>
  );
}
