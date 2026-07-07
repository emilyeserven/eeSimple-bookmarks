import { Link, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useHeaderBreadcrumbs } from "./-appHeaderCrumbs";
import { useHeaderToolbarActions } from "./-appHeaderToolbar";

import { AppAddBookmarkModal } from "@/components/AppAddBookmarkModal";
import { AppSyncModal } from "@/components/AppSyncModal";
import { HeaderBreadcrumbs } from "@/components/header/HeaderBreadcrumbs";
import { HeaderProgressIndicators } from "@/components/header/HeaderProgressIndicators";
import { HeaderToolbar } from "@/components/header/HeaderToolbar";
import { NotificationsBellPopover } from "@/components/NotificationsBellPopover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Top app bar: sidebar trigger, breadcrumbs derived from the path, notifications, and the toolbar. */
export function AppHeader() {
  const {
    t,
  } = useTranslation();
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  // The `?tab=` search param labels the edit crumb for entities on the unified `…/edit?tab=` route.
  const editTab = useRouterState({
    select: state => (state.location.search as { tab?: string }).tab,
  });

  const pathParts = pathname.split("/").filter(Boolean);

  // The breadcrumb trail plus the few raw entities the pin / add-child controls reuse. Bundled into
  // one hook to keep this component under the complexity cap.
  const {
    crumbs, ...toolbarData
  } = useHeaderBreadcrumbs(pathname, pathParts, editTab);

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
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("Settings")}
        >
          <Link to="/settings">
            <Settings className="size-4" />
          </Link>
        </Button>
        <NotificationsBellPopover />
        <HeaderToolbar actions={toolbarActions} />
      </div>
      <AppAddBookmarkModal />
      <AppSyncModal />
    </header>
  );
}
