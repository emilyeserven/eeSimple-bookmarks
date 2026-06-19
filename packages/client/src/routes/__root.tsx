import type { QueryClient } from "@tanstack/react-query";

import {
  createRootRouteWithContext,
  retainSearchParams,
} from "@tanstack/react-router";

import { RootLayout } from "./-rootLayout";

import { validateDrawerSearch } from "@/lib/drawerSearch";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: validateDrawerSearch,
  search: {
    // Carry the panel's drawer params across every navigation so it survives route changes.
    middlewares: [retainSearchParams(["dOpen", "dCT", "dCId", "dMode"])],
  },
  component: RootLayout,
});
