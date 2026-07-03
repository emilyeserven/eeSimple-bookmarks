import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single album: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/albums/$albumSlug")({
  component: AlbumLayout,
});

function AlbumLayout() {
  return <Outlet />;
}
