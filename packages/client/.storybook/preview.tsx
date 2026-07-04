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
import { I18nextProvider } from "react-i18next";

import i18n from "../src/i18n";
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

/**
 * Wrap each story in the i18next provider and switch the active locale from the toolbar `locale`
 * global (`en`/`ja`). Lets the owner review translated states as `ja.json` is filled in; with
 * English-phrase keys, an untranslated `ja` entry renders identically to `en`.
 */
const withI18n: Decorator = (Story, context) => {
  const locale = (context.globals.locale as string) ?? "en";
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return (
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  );
};

const preview: Preview = {
  decorators: [withI18n, withQueryClient, withRouter],
  loaders: [mswLoader],
  globalTypes: {
    locale: {
      description: "Interface language",
      defaultValue: "en",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: [
          {
            value: "en",
            title: "English",
          },
          {
            value: "ja",
            title: "日本語 (Japanese)",
          },
        ],
        dynamicTitle: true,
      },
    },
  },
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
