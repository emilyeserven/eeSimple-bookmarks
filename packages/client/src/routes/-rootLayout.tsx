import type { CSSProperties } from "react";

import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";

import { AppHeader } from "./-appHeader";

import { AppSidebar } from "@/components/app-sidebar";
import { RightPanel } from "@/components/panel/RightPanel";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useUiStore } from "@/stores/uiStore";

export function RootLayout() {
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
        <AppHeader />
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
