import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a person's edit surface. The page lives in the `index` child; the `$` child
 *  redirects the old per-tab paths. */
export const Route = createFileRoute("/taxonomies/people/$personSlug/edit")({
  component: Outlet,
});
