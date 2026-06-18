import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single media type: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug")({
  component: MediaTypeLayout,
});

function MediaTypeLayout() {
  return <Outlet />;
}
