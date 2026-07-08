import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/people`, `…/edit/shortened-links`,
 * `…/edit/param-rules`, `…/edit/autofill`, `…/edit/display-rules`, `…/edit/languages`) to the unified
 * `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/websites/$websiteSlug/edit",
      params: {
        websiteSlug: params.websiteSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
