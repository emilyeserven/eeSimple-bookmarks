import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/genres-moods/$genreMoodSlug/edit",
      params: {
        genreMoodSlug: params.genreMoodSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
