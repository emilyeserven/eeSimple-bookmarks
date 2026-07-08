import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a bookmark's edit surface. The page lives in the `index` child; the `$` child
 *  redirects the old per-tab paths (`…/edit/general`, …). Keeping the page in `index` (not here) makes
 *  the exact `/edit` path unambiguous against the `$` splat — the #1155 category/newsletter pattern. */
export const Route = createFileRoute("/bookmarks/$bookmarkId/edit")({
  component: Outlet,
});
