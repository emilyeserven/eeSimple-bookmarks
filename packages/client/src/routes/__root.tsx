import type { QueryClient } from "@tanstack/react-query";
import type { CSSProperties } from "react";

import React from "react";

import {
  Link,
  Outlet,
  createRootRouteWithContext,
  retainSearchParams,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { PanelRight } from "lucide-react";
import { Toaster } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { RightPanel } from "@/components/panel/RightPanel";
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useCategoryBySlug } from "@/hooks/useCategories";
import { validateDrawerSearch } from "@/lib/drawerSearch";
import { useUiStore } from "@/stores/uiStore";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: validateDrawerSearch,
  search: {
    // Carry the panel's drawer params across every navigation so it survives route changes.
    middlewares: [retainSearchParams(["dOpen", "dCT", "dCId", "dMode"])],
  },
  component: RootComponent,
});

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

const TAXONOMY_CRUMBS = [
  {
    prefix: "/taxonomies/websites",
    listLabel: "Websites",
    detailLabel: "Website",
  },
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
  // `/categories/$slug` (bookmark browse) and `/categories/$slug/settings` (read-only view).
  if (parts.length === 2 || parts[2] === "settings") {
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
    href: `/categories/${parts[1]}/settings`,
  }, {
    label: sectionLabel,
  }];
}

function tagCrumbs(pathname: string): BreadcrumbSegment[] {
  const parts = pathname.split("/").filter(Boolean);
  // `/tags` — the listing page.
  if (parts.length === 1) return [{
    label: "Tags",
  }];
  const listCrumb: BreadcrumbSegment = {
    label: "Tags",
    href: "/tags",
  };
  // `/tags/$slug/edit` deepens one level past the tag's view.
  if (parts[2] === "edit") {
    return [listCrumb, {
      label: "Tag",
      href: `/tags/${parts[1]}/settings`,
    }, {
      label: "Edit",
    }];
  }
  return [listCrumb, {
    label: "Tag",
  }];
}

/** Derive breadcrumb segments from a pathname. */
function breadcrumbsForPath(pathname: string, categoryName?: string): BreadcrumbSegment[] {
  if (pathname === "/") return [{
    label: "Home",
  }];
  if (pathname === "/bookmarks") return [{
    label: "Bookmarks",
  }];
  if (pathname.startsWith("/bookmarks/"))
    return [{
      label: "Bookmarks",
      href: "/bookmarks",
    }, {
      label: "Bookmark",
    }];
  if (pathname.startsWith("/settings")) return settingsCrumbs(pathname);
  if (pathname === "/categories" || pathname.startsWith("/categories/"))
    return categoryCrumbs(pathname, categoryName);
  if (pathname === "/tags" || pathname.startsWith("/tags/")) return tagCrumbs(pathname);

  const taxonomy = TAXONOMY_CRUMBS.find(t => pathname.startsWith(t.prefix));
  if (taxonomy) {
    if (pathname === taxonomy.prefix) return [{
      label: taxonomy.listLabel,
    }];
    return [{
      label: taxonomy.listLabel,
      href: taxonomy.prefix,
    }, {
      label: taxonomy.detailLabel,
    }];
  }
  return [{
    label: "eeSimple Bookmarks",
  }];
}

function RootComponent() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const categorySlug = pathname.startsWith("/categories/")
    ? (pathname.split("/").filter(Boolean)[1] ?? "")
    : "";
  const {
    category,
  } = useCategoryBySlug(categorySlug);
  const crumbs = breadcrumbsForPath(pathname, category?.name);
  const {
    open,
  } = usePanelControls();
  const theme = useUiStore(state => state.theme);
  const sidebarWidth = useUiStore(state => state.sidebarWidth);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": `${sidebarWidth}rem`,
      } as CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 ml-auto border-l pl-2"
            aria-label="Open panel"
            onClick={open}
          >
            <PanelRight className="size-4" />
          </Button>
        </header>
        <main className="w-full px-4 py-8">
          <Outlet />
        </main>
      </SidebarInset>
      <RightPanel />
      <Toaster
        richColors
        theme={theme}
      />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </SidebarProvider>
  );
}
