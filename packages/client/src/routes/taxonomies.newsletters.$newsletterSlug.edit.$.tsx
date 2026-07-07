import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`) to the unified `…/edit?tab=<tab>` route.
 * The empty-segment guard keeps the bare `…/edit` (owned by the `index` child) from landing here.
 */
export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/newsletters/$newsletterSlug/edit",
      params: {
        newsletterSlug: params.newsletterSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
