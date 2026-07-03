import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single podcast: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug")({
  component: PodcastLayout,
});

function PodcastLayout() {
  return <Outlet />;
}
