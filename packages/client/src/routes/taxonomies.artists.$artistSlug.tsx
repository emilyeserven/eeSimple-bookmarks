import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single artist: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/artists/$artistSlug")({
  component: ArtistLayout,
});

function ArtistLayout() {
  return <Outlet />;
}
