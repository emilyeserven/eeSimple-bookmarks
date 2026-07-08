import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/conditions`) to the unified
 * `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/import-rules/$ruleSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/import-rules/$ruleSlug/edit",
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
