import { useEffect } from "react";

import { Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { setCurrentNotificationPage } from "@/lib/notificationPage";
import { useUiStore } from "@/stores/uiStore";

export function RootLayout() {
  const theme = useUiStore(state => state.theme);
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });

  // Stamp the current page onto toasts recorded in the notification log.
  useEffect(() => {
    setCurrentNotificationPage({
      pathname,
      label: "",
    });
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="w-full px-4 py-8">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster
        richColors
        expand
        theme={theme}
      />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </SidebarProvider>
  );
}
