import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single entry: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug")({
  component: GenreMoodLayout,
});

function GenreMoodLayout() {
  return <Outlet />;
}
