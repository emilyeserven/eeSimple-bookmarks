import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/categories`, `…/edit/media-types`,
 * `…/edit/display-rules`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/property-groups/$propertyGroupSlug/edit",
      params: {
        propertyGroupSlug: params.propertyGroupSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
