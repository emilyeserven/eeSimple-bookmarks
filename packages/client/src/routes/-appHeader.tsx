import { Link, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { useHeaderBreadcrumbs } from "./-appHeaderCrumbs";
import { useHeaderToolbarActions } from "./-appHeaderToolbar";

import { HeaderBreadcrumbs } from "@/components/header/HeaderBreadcrumbs";
import { HeaderProgressIndicators } from "@/components/header/HeaderProgressIndicators";
import { HeaderToolbar } from "@/components/header/HeaderToolbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Top app bar: sidebar trigger, breadcrumbs derived from the path, and the panel toggle. */
export function AppHeader() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });

  const pathParts = pathname.split("/").filter(Boolean);

  // The breadcrumb trail plus the few raw entities the pin / add-child controls reuse. Bundled into
  // one hook to keep this component under the complexity cap.
  const {
    crumbs, ...toolbarData
  } = useHeaderBreadcrumbs(pathname, pathParts);

  const toolbarActions = useHeaderToolbarActions(pathname, pathParts, toolbarData);

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
      <HeaderProgressIndicators />
      {/* Right-aligned group: a single `ml-auto` keeps the mobile Settings icon next to the toolbar
          instead of two competing `ml-auto`s splitting the free space and centering it. */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Settings"
        >
          <Link to="/settings">
            <Settings className="size-4" />
          </Link>
        </Button>
        <HeaderToolbar actions={toolbarActions} />
      </div>
    </header>
  );
}
