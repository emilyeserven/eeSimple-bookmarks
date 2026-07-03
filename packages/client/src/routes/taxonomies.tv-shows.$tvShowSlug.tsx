import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single TV show: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug")({
  component: TvShowLayout,
});

function TvShowLayout() {
  return <Outlet />;
}
