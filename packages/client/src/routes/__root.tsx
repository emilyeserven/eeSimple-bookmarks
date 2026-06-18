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
  "automations": "Automations",
  "autofill": "Autofill",
};

const CATEGORY_EDIT_SUBLABELS: Record<string, string> = {
  "general": "General",
  "custom-properties": "Custom Properties",
  "tiered-tags": "Tiered Tags",
  "autofill": "Autofill",
};

/** Derive breadcrumb segments from a pathname. */
function breadcrumbsForPath(pathname: string): BreadcrumbSegment[] {
  if (pathname === "/") return [{ label: "Home" }];
  if (pathname === "/bookmarks") return [{ label: "Bookmarks" }];

  if (pathname.startsWith("/bookmarks/")) {
    return [
      { label: "Bookmarks", href: "/bookmarks" },
      { label: "Bookmark" },
    ];
  }

  if (pathname.startsWith("/settings")) {
    const rest = pathname.slice("/settings".length).replace(/^\//, "");
    if (!rest) return [{ label: "Settings" }];
    const parts = rest.split("/");
    const sub = parts[0];
    const subLabel = SETTINGS_SUBLABELS[sub] ?? sub;
    if (sub === "autofill" && parts.length > 1) {
      return [
        { label: "Settings", href: "/settings" },
        { label: "Autofill", href: "/settings/autofill" },
        { label: "Rule" },
      ];
    }
    return [
      { label: "Settings", href: "/settings" },
      { label: subLabel },
    ];
  }

  if (pathname.startsWith("/categories/")) {
    const parts = pathname.split("/").filter(Boolean);
    const categoryHref = `/${parts[0]}/${parts[1]}`;
    if (parts.length <= 2) return [{ label: "Category" }];
    if (parts.length === 3) {
      return [
        { label: "Category", href: categoryHref },
        { label: "Edit" },
      ];
    }
    const sectionLabel = CATEGORY_EDIT_SUBLABELS[parts[3]] ?? parts[3];
    return [
      { label: "Category", href: categoryHref },
      { label: sectionLabel },
    ];
  }

  if (pathname.startsWith("/taxonomies/websites")) {
    if (pathname === "/taxonomies/websites") return [{ label: "Websites" }];
    return [
      { label: "Websites", href: "/taxonomies/websites" },
      { label: "Website" },
    ];
  }

  if (pathname.startsWith("/taxonomies/tags")) return [{ label: "Tags" }];

  return [{ label: "eeSimple Bookmarks" }];
}

function RootComponent() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const crumbs = breadcrumbsForPath(pathname);
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
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
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
