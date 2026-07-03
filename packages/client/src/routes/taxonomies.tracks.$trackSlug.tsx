import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single track: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/tracks/$trackSlug")({
  component: TrackLayout,
});

function TrackLayout() {
  return <Outlet />;
}
