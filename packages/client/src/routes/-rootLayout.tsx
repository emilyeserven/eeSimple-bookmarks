import type { CSSProperties } from "react";

import { Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";

import { AppHeader } from "./-appHeader";

import { AppSidebar } from "@/components/app-sidebar";
import { AppOverlays } from "@/components/AppOverlays";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useOfflineToast } from "@/hooks/useOfflineToast";
import { useServerUnreachableToast } from "@/hooks/useServerUnreachableToast";
import { useSyncInterfaceLanguage } from "@/hooks/useSyncInterfaceLanguage";
import { useUiStore } from "@/stores/uiStore";

export function RootLayout() {
  const theme = useUiStore(state => state.theme);
  const sidebarWidth = useUiStore(state => state.sidebarWidth);
  // Surface online/offline connectivity as a toast on every surface (full app + quick-add popup).
  useOfflineToast();
  // Show a Tailscale-specific warning when the browser is online but the app server is unreachable.
  useServerUnreachableToast();
  // Keep i18next + document.lang in sync with the persisted interface-language setting.
  useSyncInterfaceLanguage();
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
      <AppOverlays />
      <Toaster
        richColors
        expand
        theme={theme}
      />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </SidebarProvider>
  );
}
