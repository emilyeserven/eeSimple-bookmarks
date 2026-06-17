import type { QueryClient } from "@tanstack/react-query";

import {
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
  BreadcrumbList,
  BreadcrumbPage,
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

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/bookmarks": "Bookmarks",
};

/** Resolve the breadcrumb title for a path, handling nested settings/category routes. */
function titleForPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/categories")) return "Category";
  if (pathname.startsWith("/taxonomies/websites")) return "Websites";
  return "eeSimple Bookmarks";
}

function RootComponent() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const title = titleForPath(pathname);
  const {
    open,
  } = usePanelControls();
  const theme = useUiStore(state => state.theme);

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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 ml-auto"
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
