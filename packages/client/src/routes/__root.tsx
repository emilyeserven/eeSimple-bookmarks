import type { QueryClient } from "@tanstack/react-query";

import { Outlet, createRootRouteWithContext, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/bookmarks": "Bookmarks",
  "/tags": "Tags",
};

/** Resolve the breadcrumb title for a path, handling nested settings/category routes. */
function titleForPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/categories")) return "Category";
  return "eeSimple Bookmarks";
}

/** The search pages (Bookmarks + categories) use a wider column for their filter sidebar. */
function isWidePath(pathname: string): boolean {
  return pathname === "/bookmarks" || pathname.startsWith("/categories");
}

function RootComponent() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const title = titleForPath(pathname);

  return (
    <SidebarProvider>
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
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main
          className={`
            mx-auto w-full px-4 py-8
            ${isWidePath(pathname) ? "max-w-6xl" : "max-w-3xl"}
          `}
        >
          <Outlet />
        </main>
      </SidebarInset>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </SidebarProvider>
  );
}
