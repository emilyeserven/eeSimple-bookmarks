import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/saved-filters/$filterSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/saved-filters/$filterSlug/edit",
      params: {
        filterSlug: params.filterSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
