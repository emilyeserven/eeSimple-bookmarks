import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single episode: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug")({
  component: EpisodeLayout,
});

function EpisodeLayout() {
  return <Outlet />;
}
