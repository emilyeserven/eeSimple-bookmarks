import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single publisher: detail view and edit page render through here. */
export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug")({
  component: PublisherLayout,
});

function PublisherLayout() {
  return <Outlet />;
}
