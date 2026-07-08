import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/languages/$languageSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/languages/$languageSlug/edit",
      params: {
        languageSlug: params.languageSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
