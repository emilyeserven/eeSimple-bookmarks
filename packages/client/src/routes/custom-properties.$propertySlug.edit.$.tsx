import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/options`, `…/edit/categories`,
 * `…/edit/media-types`, `…/edit/display`, `…/edit/autofill`, `…/edit/display-rules`) to the unified
 * `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/custom-properties/$propertySlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/custom-properties/$propertySlug/edit",
      params: {
        propertySlug: params.propertySlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
