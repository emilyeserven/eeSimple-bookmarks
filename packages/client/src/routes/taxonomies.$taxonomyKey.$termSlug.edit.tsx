import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a term's edit surface. The page lives in the `index` child. */
export const Route = createFileRoute("/taxonomies/$taxonomyKey/$termSlug/edit")({
  component: Outlet,
});
