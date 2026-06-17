import type { Decorator, Preview } from "@storybook/react-vite";

import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { initialize, mswLoader } from "msw-storybook-addon";

import "../src/index.css";

// Start the MSW worker so stories can mock `/api/*` requests via
// `parameters.msw.handlers`. Unhandled requests pass through untouched.
initialize({
  onUnhandledRequest: "bypass",
});

/** Provide a React Query client so hooks-driven components can fetch. */
const withQueryClient: Decorator = (Story) => {
  const client = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
    [],
  );
  return (
    <QueryClientProvider client={client}>
      <Story />
    </QueryClientProvider>
  );
};

/**
 * Mount each story inside a TanStack Router so components using `<Link>` /
 * `useRouterState` render in isolation. A memory history keeps it self-contained.
 */
const withRouter: Decorator = (Story) => {
  const router = React.useMemo(() => {
    const rootRoute = createRootRoute({
      component: () => <Story />,
    });
    return createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({
        initialEntries: ["/"],
      }),
    });
  }, [Story]);
  // The story router is intentionally narrower than the app router's type.
  return <RouterProvider router={router as never} />;
};

const preview: Preview = {
  decorators: [withQueryClient, withRouter],
  loaders: [mswLoader],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
