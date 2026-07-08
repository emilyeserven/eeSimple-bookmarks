import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/conditions`, `…/edit/prefill`) to
 * the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/autofill/$ruleSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/autofill/$ruleSlug/edit",
      params: {
        ruleSlug: params.ruleSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
