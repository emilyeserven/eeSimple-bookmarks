import type { TagNode } from "@eesimple/types";

import React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import { PanelRight } from "lucide-react";

import { FilterLocationPopover } from "@/components/FilterLocationPopover";
import { ListingOptionsPopover } from "@/components/ListingOptionsPopover";
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
import { useBookmark } from "@/hooks/useBookmarks";
import { useCategories, useCategoryBySlug } from "@/hooks/useCategories";
import { useMediaTypeBySlug } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { useWebsiteBySlug } from "@/hooks/useWebsites";
import { findAncestorPath } from "@/lib/tagTree";
import { useUiStore } from "@/stores/uiStore";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const SETTINGS_SUBLABELS: Record<string, string> = {
  "display": "Display",
  "tags": "Tags",
  "categories": "Categories",
  "custom-properties": "Custom Properties",
  "websites": "Websites",
  "media-types": "Media Types",
  "youtube-channels": "YouTube Channels",
  "automations": "Automations",
  "autofill": "Autofill",
};

const CATEGORY_EDIT_SUBLABELS: Record<string, string> = {
  "general": "General",
  "custom-properties": "Custom Properties",
  "tiered-tags": "Tiered Tags",
  "autofill": "Autofill",
};

const WEBSITE_EDIT_SUBLABELS: Record<string, string> = {
  "general": "General",
  "shortened-links": "Shortened Links",
  "param-rules": "Param Rules",
  "autofill": "Autofill Rules",
};

const TAXONOMY_CRUMBS = [
  {
    prefix: "/taxonomies/media-types",
    listLabel: "Media Types",
    detailLabel: "Media Type",
  },
  {
    prefix: "/taxonomies/youtube-channels",
    listLabel: "YouTube Channels",
    detailLabel: "Channel",
  },
  {
    prefix: "/custom-properties",
    listLabel: "Custom Properties",
    detailLabel: "Custom Property",
  },
  {
    prefix: "/autofill",
    listLabel: "Autofill Rules",
    detailLabel: "Rule",
  },
] as const;

function websiteCrumbs(pathname: string, websiteName?: string): BreadcrumbSegment[] {
  const parts = pathname.split("/").filter(Boolean);
  // `/taxonomies/websites` — the listing page.
  if (parts.length === 2) return [{
    label: "Websites",
  }];
  const listCrumb: BreadcrumbSegment = {
    label: "Websites",
    href: "/taxonomies/websites",
  };
  const siteLabel = websiteName ?? "Website";
  // View tabs (no `edit` segment in path)
  if (parts[3] !== "edit") {
    return [listCrumb, {
      label: siteLabel,
    }];
  }
  // `/taxonomies/websites/$slug/edit/<tab>` — link name back to its view.
  const sectionLabel = parts.length > 4
    ? (WEBSITE_EDIT_SUBLABELS[parts[4]] ?? parts[4])
    : "Edit";
  return [listCrumb, {
    label: siteLabel,
    href: `/taxonomies/websites/${parts[2]}/general`,
  }, {
    label: sectionLabel,
  }];
}

function settingsCrumbs(pathname: string): BreadcrumbSegment[] {
  const rest = pathname.slice("/settings".length).replace(/^\//, "");
  if (!rest) return [{
    label: "Settings",
  }];
  const parts = rest.split("/");
  const sub = parts[0];
  return [{
    label: "Settings",
    href: "/settings",
  }, {
    label: SETTINGS_SUBLABELS[sub] ?? sub,
  }];
}

function categoryCrumbs(pathname: string, categoryName?: string): BreadcrumbSegment[] {
  const parts = pathname.split("/").filter(Boolean);
  // `/categories` — the listing page.
  if (parts.length === 1) return [{
    label: "Categories",
  }];
  const listCrumb: BreadcrumbSegment = {
    label: "Categories",
    href: "/categories",
  };
  const catLabel = categoryName ?? "Category";
  // `/categories/$slug` (bookmark browse) and all `_view` tabs (general, tiered-tags, etc.).
  if (parts.length === 2 || parts[2] !== "edit") {
    return [listCrumb, {
      label: catLabel,
    }];
  }
  // `/categories/$slug/edit/<tab>` — link the name back to its view.
  const sectionLabel = parts.length > 3
    ? (CATEGORY_EDIT_SUBLABELS[parts[3]] ?? parts[3])
    : "Edit";
  return [listCrumb, {
    label: catLabel,
    href: `/categories/${parts[1]}/general`,
  }, {
    label: sectionLabel,
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
        href: `/tags/${parts[1]}/settings`,
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
      href: `/tags/${parts[1]}/settings`,
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

/** Derive breadcrumb segments from a pathname. */
function breadcrumbsForPath(
  pathname: string,
  categoryName?: string,
  tagAncestors?: TagNode[],
  bookmarkData?: BookmarkCrumbData,
  websiteName?: string,
  mediaTypeName?: string,
): BreadcrumbSegment[] {
  if (pathname === "/") return [{
    label: "Home",
  }];
  if (pathname === "/bookmarks") return [{
    label: "Bookmarks",
  }];
  if (pathname.startsWith("/bookmarks/"))
    return bookmarkCrumbs(pathname, bookmarkData);
  if (pathname.startsWith("/settings")) return settingsCrumbs(pathname);
  if (pathname === "/categories" || pathname.startsWith("/categories/"))
    return categoryCrumbs(pathname, categoryName);
  if (pathname === "/tags" || pathname.startsWith("/tags/")) return tagCrumbs(pathname, tagAncestors);
  if (pathname === "/taxonomies/websites" || pathname.startsWith("/taxonomies/websites/"))
    return websiteCrumbs(pathname, websiteName);

  const taxonomy = TAXONOMY_CRUMBS.find(t => pathname.startsWith(t.prefix));
  if (taxonomy) {
    if (pathname === taxonomy.prefix) return [{
      label: taxonomy.listLabel,
    }];
    const itemLabel = (taxonomy.prefix === "/taxonomies/media-types" && mediaTypeName)
      ? mediaTypeName
      : taxonomy.detailLabel;
    return [{
      label: taxonomy.listLabel,
      href: taxonomy.prefix,
    }, {
      label: itemLabel,
    }];
  }
  return [{
    label: "eeSimple Bookmarks",
  }];
}

/** Top app bar: sidebar trigger, breadcrumbs derived from the path, and the panel toggle. */
export function AppHeader() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });

  // Category breadcrumbs
  const categorySlug = pathname.startsWith("/categories/")
    ? (pathname.split("/").filter(Boolean)[1] ?? "")
    : "";
  const {
    category,
  } = useCategoryBySlug(categorySlug);

  // Tag breadcrumbs
  const tagSlug = pathname.startsWith("/tags/")
    ? (pathname.split("/").filter(Boolean)[1] ?? "")
    : "";
  const {
    data: tagTree,
  } = useTagTree();
  const tagAncestors = tagSlug && tagTree
    ? (findAncestorPath(tagTree, tagSlug) ?? undefined)
    : undefined;

  // Website breadcrumbs
  const websiteSlug = pathname.startsWith("/taxonomies/websites/")
    ? (pathname.split("/").filter(Boolean)[2] ?? "")
    : "";
  const {
    website,
  } = useWebsiteBySlug(websiteSlug);

  // Media type breadcrumbs
  const mediaTypeSlug = pathname.startsWith("/taxonomies/media-types/")
    ? (pathname.split("/").filter(Boolean)[2] ?? "")
    : "";
  const {
    mediaType,
  } = useMediaTypeBySlug(mediaTypeSlug);

  // Bookmark breadcrumbs — extract bookmarkId from /bookmarks/$id[/...]
  const bookmarkId = pathname.startsWith("/bookmarks/")
    ? (pathname.split("/").filter(Boolean)[1] ?? "")
    : "";
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

  const crumbs = breadcrumbsForPath(
    pathname,
    category?.name,
    tagAncestors,
    bookmarkData,
    website?.siteName,
    mediaType?.name,
  );

  // Show Edit button in the header only on the bookmark detail page (not edit pages)
  const isBookmarkDetail = Boolean(bookmarkId)
    && !pathname.includes("/edit")
    && pathname.startsWith("/bookmarks/");

  // Category browse page (the index route — `/categories/<slug>`, not its `_view`/`edit` tabs).
  const pathParts = pathname.split("/").filter(Boolean);
  const isCategoryListing = pathParts[0] === "categories" && pathParts.length === 2;

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
      key: "listing-options",
      node: (
        <ListingOptionsPopover
          pageKey={listingPage.key}
          showsImages={listingPage.showsImages}
        />
      ),
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
  if (isCategoryListing) {
    toolbarActions.push({
      key: "edit-category",
      node: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
        >
          <Link
            to="/categories/$categorySlug/edit/general"
            params={{
              categorySlug,
            }}
          >
            Edit
          </Link>
        </Button>
      ),
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
