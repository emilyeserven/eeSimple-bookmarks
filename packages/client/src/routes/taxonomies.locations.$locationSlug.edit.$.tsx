import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/autofill`, `…/edit/display-rules`)
 * to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/locations/$locationSlug/edit",
      params: {
        locationSlug: params.locationSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
