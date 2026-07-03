import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single movie: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/movies/$movieSlug")({
  component: MovieLayout,
});

function MovieLayout() {
  return <Outlet />;
}
