import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/youtube-channels`,
 * `…/edit/websites`, `…/edit/groups`, `…/edit/languages`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/people/$personSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/people/$personSlug/edit",
      params: {
        personSlug: params.personSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
