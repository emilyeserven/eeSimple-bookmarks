import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/location-relations/$locationRelationSlug/edit",
      params: {
        locationRelationSlug: params.locationRelationSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
