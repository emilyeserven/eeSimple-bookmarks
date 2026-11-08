import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, render } from "@testing-library/react";

interface RenderWithRouterOptions {
  /**
   * Extra route paths to register so any `<Link to=...>` inside `ui` resolves. The component under
   * test renders at the index route; these are declared as empty sibling routes.
   */
  paths?: string[];
}

/**
 * Render a component that uses TanStack Router primitives (e.g. `<Link>`) inside a minimal
 * in-memory router. Pass `paths` for every route a rendered `<Link>` targets. Awaits the router's
 * initial load so the rendered tree is ready for synchronous queries.
 *
 * The mount itself is wrapped in an async `act(...)`: `RouterProvider` settles its match state
 * (`MatchInnerImpl`) in a microtask-scheduled update after mount, which — left unwrapped — lands
 * outside React's `act` scope and prints the intermittent "not wrapped in act(...)" warning on
 * slower/loaded environments (it races the sync render on fast ones). Flushing the settle inside
 * `act` here silences it once for every caller of this helper.
 */
export async function renderWithRouter(ui: ReactNode, {
  paths = [],
}: RenderWithRouterOptions = {}) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{ui}</>,
  });
  const extraRoutes = paths.map(path =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => null,
    }));
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...extraRoutes]),
    history: createMemoryHistory({
      initialEntries: ["/"],
    }),
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  await router.load();
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  });
  return result;
}
