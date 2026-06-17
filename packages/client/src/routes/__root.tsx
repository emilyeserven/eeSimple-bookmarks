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

function RootComponent() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const title = PAGE_TITLES[pathname] ?? "eeSimple Bookmarks";

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
        <main className="mx-auto w-full max-w-3xl px-4 py-8">
          <Outlet />
        </main>
      </SidebarInset>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </SidebarProvider>
  );
}
