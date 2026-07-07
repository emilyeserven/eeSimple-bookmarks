import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/autofill`, `…/edit/display-rules`)
 * to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/tags/$tagSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/tags/$tagSlug/edit",
      params: {
        tagSlug: params.tagSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
