import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a category's edit surface. The page lives in the `index` child; the `$` child
 *  redirects the old per-tab paths. Keeping the page in `index` (not here) makes the exact `/edit`
 *  path unambiguous against the `$` splat. */
export const Route = createFileRoute("/categories/$categorySlug/edit")({
  component: Outlet,
});
