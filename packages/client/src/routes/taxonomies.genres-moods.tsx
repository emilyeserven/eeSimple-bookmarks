import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Genres & Moods taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/genres-moods")({
  component: () => <Outlet />,
});
