import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/people`) to the unified
 * `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/groups/$groupSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/groups/$groupSlug/edit",
      params: {
        groupSlug: params.groupSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
