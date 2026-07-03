import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single media property: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug")({
  component: MediaPropertyLayout,
});

function MediaPropertyLayout() {
  return <Outlet />;
}
