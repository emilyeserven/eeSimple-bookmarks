import { StrictMode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

// Importing `./i18n` initializes i18next before the first render so `t()` resolves during the
// initial paint; the instance is also provided via context below.
import { SecondaryDisplayLanguageProvider } from "./hooks/SecondaryDisplayLanguageProvider";
import i18n from "./i18n";
import { queryClient } from "./lib/queryClient";
import { watchTheme } from "./lib/theme";
import { routeTree } from "./routeTree.gen";
import { useUiStore } from "./stores/uiStore";
import "./index.css";

// Apply the persisted theme before first paint, and keep it in sync with both
// store changes and (for "system") the OS color-scheme preference.
let currentTheme = useUiStore.getState().theme;
let stopWatching = watchTheme(currentTheme);
useUiStore.subscribe((state) => {
  if (state.theme === currentTheme) return;
  currentTheme = state.theme;
  stopWatching();
  stopWatching = watchTheme(currentTheme);
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SecondaryDisplayLanguageProvider>
          <RouterProvider router={router} />
        </SecondaryDisplayLanguageProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
);
