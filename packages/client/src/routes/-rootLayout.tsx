import type { CSSProperties } from "react";

import { Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";

import { AppHeader } from "./-appHeader";

import { AddImportModal } from "@/components/AddImportModal";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { RightPanel } from "@/components/panel/RightPanel";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useUiStore } from "@/stores/uiStore";

export function RootLayout() {
  const theme = useUiStore(state => state.theme);
  const sidebarWidth = useUiStore(state => state.sidebarWidth);
  // The quick-add popup is chrome-less: it renders the bare form (no sidebar/header/right panel) so
  // it fits a small popup window.
  const isQuickAdd = useRouterState({
    select: state => state.location.pathname.startsWith("/quick-add"),
  });

  if (isQuickAdd) {
    return (
      <>
        <Outlet />
        <Toaster
          richColors
          expand
          theme={theme}
        />
        {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      </>
    );
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": `${sidebarWidth}rem`,
      } as CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="w-full px-4 py-8">
          <Outlet />
        </main>
      </SidebarInset>
      <RightPanel />
      <AddImportModal />
      <CommandPalette />
      <Toaster
        richColors
        expand
        theme={theme}
      />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </SidebarProvider>
  );
}
