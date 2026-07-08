import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab bookmark edit paths (`…/edit/general`, `…/edit/image`, …) to the unified
 * `…/edit?tab=<tab>` route. `beforeLoad` throws during matching, before any render. The legacy
 * `…/edit/relationships` path folds to the `related` tab (as it did before the registry migration).
 * The empty-segment guard keeps the bare `…/edit` (which the `index` child owns) from ever landing here.
 */
export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    const tab = segment === "relationships" ? "related" : segment;
    throw redirect({
      to: "/bookmarks/$bookmarkId/edit",
      params: {
        bookmarkId: params.bookmarkId,
      },
      search: tab
        ? {
          tab,
        }
        : {},
    });
  },
});
