import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/place-types/$placeTypeSlug/edit",
      params: {
        placeTypeSlug: params.placeTypeSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
