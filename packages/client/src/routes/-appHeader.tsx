import type { PinContext } from "@/components/HeaderPinButton";
import type { TagNode } from "@eesimple/types";

import React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import { Info, PanelRight, Plus } from "lucide-react";

import { AddChildButton } from "@/components/AddChildButton";
import { BookmarkDetailLayoutPopover } from "@/components/BookmarkDetailLayoutPopover";
import { DisplayOptionsPopover } from "@/components/DisplayOptionsPopover";
import { FilterLocationPopover } from "@/components/FilterLocationPopover";
import { HeaderPinButton } from "@/components/HeaderPinButton";
import { HeaderSettingsFavoriteButton } from "@/components/HeaderSettingsFavoriteButton";
import { ListingSearchBar } from "@/components/ListingSearchBar";
import { usePanelControls } from "@/components/panel/usePanelControls";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAutofillRuleBySlug } from "@/hooks/useAutofill";
import { useBookmark } from "@/hooks/useBookmarks";
import { useCategories, useCategoryBySlug } from "@/hooks/useCategories";
import { usePropertyBySlug } from "@/hooks/useCustomProperties";
import { useMediaTypeBySlug } from "@/hooks/useMediaTypes";
import { usePropertyGroupBySlug } from "@/hooks/usePropertyGroups";
import { useRelationshipTypeBySlug } from "@/hooks/useRelationshipTypes";
import { useTagTree } from "@/hooks/useTags";
import { useWebsiteBySlug } from "@/hooks/useWebsites";
import { useYouTubeChannelBySlug } from "@/hooks/useYouTubeChannels";
import { findSettingsPage } from "@/lib/settingsPages";
import { findAncestorPath } from "@/lib/tagTree";
import { useUiStore } from "@/stores/uiStore";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

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
  },
  {
    prefix: "/taxonomies/websites",
    listLabel: "Websites",
    singular: "Website",
    slugIndex: 2,
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
  },
  {
    prefix: "/taxonomies/property-groups",
    listLabel: "Property Groups",
    singular: "Property Group",
    slugIndex: 2,
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
  },
  {
    prefix: "/autofill",
    listLabel: "Autofill Rules",
    singular: "Rule",
    slugIndex: 1,
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
  // The bare detail/browse index and every `_view` tab stop at the name.
  if (parts[slugIndex + 1] !== "edit") {
    return [listCrumb, {
      label: itemLabel,
    }];
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

function tagCrumbs(pathname: string, tagAncestors?: TagNode[]): BreadcrumbSegment[] {
  const parts = pathname.split("/").filter(Boolean);
  // `/tags` — the listing page.
  if (parts.length === 1) return [{
    label: "Tags",
  }];
  const listCrumb: BreadcrumbSegment = {
    label: "Tags",
    href: "/tags",
  };
  const isEdit = parts[2] === "edit";
  if (!tagAncestors?.length) {
    const fallback: BreadcrumbSegment = isEdit
      ? {
        label: "Tag",
        href: `/tags/${parts[1]}/general`,
      }
      : {
        label: "Tag",
      };
    return isEdit
      ? [listCrumb, fallback, {
        label: "Edit",
      }]
      : [listCrumb, fallback];
  }
  const parents = tagAncestors.slice(0, -1);
  const current = tagAncestors[tagAncestors.length - 1];
  const currentCrumb: BreadcrumbSegment = isEdit
    ? {
      label: current.name,
      href: `/tags/${parts[1]}/general`,
    }
    : {
      label: current.name,
    };
  return [
    listCrumb,
    ...parents.map(t => ({
      label: t.name,
      href: `/tags/${t.slug}/general`,
    })),
    currentCrumb,
    ...(isEdit
      ? [{
        label: "Edit",
      }]
      : []),
  ];
}

interface BookmarkCrumbData {
  title: string;
  categoryName?: string;
  categorySlug?: string;
}

function bookmarkCrumbs(pathname: string, data?: BookmarkCrumbData): BreadcrumbSegment[] {
  const listCrumb: BreadcrumbSegment = {
    label: "Bookmarks",
    href: "/bookmarks",
  };
  const catCrumb: BreadcrumbSegment = data?.categorySlug
    ? {
      label: data.categoryName ?? "Category",
      href: `/categories/${data.categorySlug}`,
    }
    : {
      label: data?.categoryName ?? "Category",
    };
  const titleCrumb: BreadcrumbSegment = {
    label: data?.title ?? "Bookmark",
  };

  const isEdit = pathname.includes("/edit");
  if (isEdit) {
    // link the title back to the detail view
    const detailHref = pathname.replace(/\/edit.*$/, "");
    return [listCrumb, catCrumb, {
      ...titleCrumb,
      href: detailHref,
    }, {
      label: "Edit",
    }];
  }
  return [listCrumb, catCrumb, titleCrumb];
}

interface BreadcrumbContext {
  tagAncestors?: TagNode[];
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
  if (pathname.startsWith("/settings")) return settingsCrumbs(pathname);
  if (pathname === "/tags" || pathname.startsWith("/tags/")) return tagCrumbs(pathname, ctx.tagAncestors);

  const descriptor = TAXONOMY_DESCRIPTORS.find(
    d => pathname === d.prefix || pathname.startsWith(`${d.prefix}/`),
  );
  if (descriptor)
    return taxonomyCrumbs(pathname, descriptor, ctx.taxonomyNames?.[descriptor.prefix]);

  return [{
    label: "eeSimple Bookmarks",
  }];
}

/** Ghost icon button wrapping a typed link to a taxonomy item's read-only view page. */
function InfoLinkButton({
  children,
}: { children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="View details"
      title="View details"
      asChild
    >
      {children}
    </Button>
  );
}

/**
 * On a taxonomy listing index page (`/<entity>/<slug>`, not a `_view`/`edit` tab), return an
 * "Info" button linking to that item's read-only view page, or `null` elsewhere.
 */
function taxonomyInfoButton(pathParts: string[]): React.ReactNode {
  if (pathParts[0] === "categories" && pathParts.length === 2) {
    return (
      <InfoLinkButton>
        <Link
          to="/categories/$categorySlug/general"
          params={{
            categorySlug: pathParts[1],
          }}
        >
          <Info className="size-4" />
        </Link>
      </InfoLinkButton>
    );
  }
  if (pathParts[0] === "tags" && pathParts.length === 2) {
    return (
      <InfoLinkButton>
        <Link
          to="/tags/$tagSlug/general"
          params={{
            tagSlug: pathParts[1],
          }}
        >
          <Info className="size-4" />
        </Link>
      </InfoLinkButton>
    );
  }
  if (pathParts[0] === "taxonomies" && pathParts.length === 3) {
    const slug = pathParts[2];
    if (pathParts[1] === "websites") {
      return (
        <InfoLinkButton>
          <Link
            to="/taxonomies/websites/$websiteSlug/general"
            params={{
              websiteSlug: slug,
            }}
          >
            <Info className="size-4" />
          </Link>
        </InfoLinkButton>
      );
    }
    if (pathParts[1] === "media-types") {
      return (
        <InfoLinkButton>
          <Link
            to="/taxonomies/media-types/$mediaTypeSlug/general"
            params={{
              mediaTypeSlug: slug,
            }}
          >
            <Info className="size-4" />
          </Link>
        </InfoLinkButton>
      );
    }
    if (pathParts[1] === "youtube-channels") {
      return (
        <InfoLinkButton>
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/general"
            params={{
              channelSlug: slug,
            }}
          >
            <Info className="size-4" />
          </Link>
        </InfoLinkButton>
      );
    }
  }
  return null;
}

/** Top app bar: sidebar trigger, breadcrumbs derived from the path, and the panel toggle. */
export function AppHeader() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });

  const pathParts = pathname.split("/").filter(Boolean);
  /** Slug at `index` when on `prefix`'s pages, else "" (so the by-slug hooks short-circuit). */
  const slugFor = (prefix: string, index: number): string =>
    pathname === prefix || pathname.startsWith(`${prefix}/`) ? (pathParts[index] ?? "") : "";

  // Resolve each taxonomy entity's real name for its `List → Name` crumb. Each hook short-circuits
  // on an empty slug, so only the entity whose page is active actually looks anything up.
  const {
    category,
  } = useCategoryBySlug(slugFor("/categories", 1));
  const {
    website,
  } = useWebsiteBySlug(slugFor("/taxonomies/websites", 2));
  const {
    mediaType,
  } = useMediaTypeBySlug(slugFor("/taxonomies/media-types", 2));
  const {
    channel,
  } = useYouTubeChannelBySlug(slugFor("/taxonomies/youtube-channels", 2));
  const {
    propertyGroup,
  } = usePropertyGroupBySlug(slugFor("/taxonomies/property-groups", 2));
  const {
    relationshipType,
  } = useRelationshipTypeBySlug(slugFor("/taxonomies/relationship-types", 2));
  const {
    property,
  } = usePropertyBySlug(slugFor("/custom-properties", 1));
  const {
    rule,
  } = useAutofillRuleBySlug(slugFor("/autofill", 1));
  const taxonomyNames: Record<string, string | undefined> = {
    "/categories": category?.name,
    "/taxonomies/websites": website?.siteName,
    "/taxonomies/media-types": mediaType?.name,
    "/taxonomies/youtube-channels": channel?.name,
    "/taxonomies/property-groups": propertyGroup?.name,
    "/taxonomies/relationship-types": relationshipType?.name,
    "/custom-properties": property?.name,
    "/autofill": rule?.name,
  };

  // Tag breadcrumbs carry the ancestor chain.
  const tagSlug = slugFor("/tags", 1);
  const {
    data: tagTree,
  } = useTagTree();
  const tagAncestors = tagSlug && tagTree
    ? (findAncestorPath(tagTree, tagSlug) ?? undefined)
    : undefined;

  // Bookmark breadcrumbs carry the bookmark's category + title.
  const bookmarkId = slugFor("/bookmarks", 1);
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
      title: bookmarkForCrumb.title,
      categoryName: bookmarkCategory?.name,
      categorySlug: bookmarkCategory?.slug,
    }
    : undefined;

  const crumbs = breadcrumbsForPath(pathname, {
    tagAncestors,
    bookmarkData,
    taxonomyNames,
  });

  // Show Edit button in the header only on the bookmark detail page (not edit pages)
  const isBookmarkDetail = Boolean(bookmarkId)
    && !pathname.includes("/edit")
    && pathname.startsWith("/bookmarks/");

  // Taxonomy listing index pages (`/<entity>/<slug>`, the bookmark browse view — not its
  // `_view`/`edit` tabs) surface a header "Info" link to that item's read-only view page.
  const infoButton = taxonomyInfoButton(pathParts);

  // Settings (and settings-like management) pages get a header star to favorite the current page.
  const settingsPage = findSettingsPage(pathname);

  // On a hierarchy-taxonomy *detail* page (Tags / Media Types), offer a header button that
  // quick-creates a child of the current entity. The parent id is the already-resolved entity.
  const isTagDetail = pathParts[0] === "tags" && pathParts.length >= 2;
  const isMediaTypeDetail = pathParts[0] === "taxonomies"
    && pathParts[1] === "media-types"
    && pathParts.length >= 3;
  const addChild: { kind: "tag" | "mediaType";
    parentId: string | undefined; } | null = isTagDetail
      ? {
        kind: "tag",
        parentId: tagAncestors?.[tagAncestors.length - 1]?.id,
      }
      : isMediaTypeDetail
        ? {
          kind: "mediaType",
          parentId: mediaType?.id,
        }
        : null;

  // The pinnable entity for the current detail page, if any. Each by-slug hook is non-null only on
  // its own detail page, so at most one branch matches; tag uses the resolved ancestor chain's leaf.
  const currentTag = tagAncestors?.[tagAncestors.length - 1];
  const pinContext: PinContext | null = category
    ? {
      entityType: "category",
      entityId: category.id,
      label: category.name,
    }
    : website
      ? {
        entityType: "website",
        entityId: website.id,
        label: website.siteName,
      }
      : mediaType
        ? {
          entityType: "media-type",
          entityId: mediaType.id,
          label: mediaType.name,
        }
        : channel
          ? {
            entityType: "youtube-channel",
            entityId: channel.id,
            label: channel.name,
          }
          : currentTag
            ? {
              entityType: "tag",
              entityId: currentTag.id,
              label: currentTag.name,
            }
            : null;

  const {
    open,
  } = usePanelControls();

  const listingPage = useUiStore(state => state.listingPage);
  const headerSearchActive = useUiStore(state => state.headerSearchActive);

  // Right-side toolbar controls, left→right; only present ones render, divided by separators.
  const toolbarActions: { key: string;
    node: React.ReactNode; }[] = [];
  if (headerSearchActive) {
    toolbarActions.push({
      key: "search-bar",
      node: <ListingSearchBar />,
    });
  }
  if (listingPage?.hasFilters) {
    toolbarActions.push({
      key: "filter-location",
      node: <FilterLocationPopover />,
    });
  }
  if (listingPage) {
    toolbarActions.push({
      key: "display-options",
      node: (
        <DisplayOptionsPopover
          pageKey={listingPage.key}
        />
      ),
    });
  }
  if (isBookmarkDetail) {
    toolbarActions.push({
      key: "bookmark-layout",
      node: <BookmarkDetailLayoutPopover />,
    });
  }
  if (isBookmarkDetail) {
    toolbarActions.push({
      key: "edit-bookmark",
      node: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
        >
          <Link
            to="/bookmarks/$bookmarkId/edit/general"
            params={{
              bookmarkId,
            }}
          >
            Edit
          </Link>
        </Button>
      ),
    });
  }
  if (infoButton) {
    toolbarActions.push({
      key: "view-details",
      node: infoButton,
    });
  }
  if (listingPage?.createAction) {
    toolbarActions.push({
      key: "create",
      node: (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="New"
          onClick={listingPage.createAction}
        >
          <Plus className="size-4" />
        </Button>
      ),
    });
  }
  if (addChild) {
    toolbarActions.push({
      key: "add-child",
      node: (
        <AddChildButton
          kind={addChild.kind}
          parentId={addChild.parentId}
        />
      ),
    });
  }
  if (settingsPage) {
    toolbarActions.push({
      key: "settings-favorite",
      node: <HeaderSettingsFavoriteButton page={settingsPage} />,
    });
  }
  toolbarActions.push({
    key: "open-panel",
    node: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open panel"
        onClick={open}
      >
        <PanelRight className="size-4" />
      </Button>
    ),
  });
  if (pinContext) {
    toolbarActions.push({
      key: "pin",
      node: <HeaderPinButton context={pinContext} />,
    });
  }

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-2 border-b px-4"
    >
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.href
                  ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )
                  : <BreadcrumbPage>{crumb.label}</BreadcrumbPage>}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="-mr-1 ml-auto flex items-center gap-1">
        {toolbarActions.map((action, i) => (
          <React.Fragment key={action.key}>
            {i > 0 && (
              <Separator
                orientation="vertical"
                className="h-4"
              />
            )}
            {action.node}
          </React.Fragment>
        ))}
      </div>
    </header>
  );
}
