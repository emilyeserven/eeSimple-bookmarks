import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/autofill`, …) to the unified
 * `…/edit?tab=<tab>` route. `beforeLoad` throws during matching, before any render. The empty-segment
 * guard keeps the bare `…/edit` (which the `index` child owns) from ever landing here.
 */
export const Route = createFileRoute("/categories/$categorySlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/categories/$categorySlug/edit",
      params: {
        categorySlug: params.categorySlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
