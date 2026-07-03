import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the TV Shows area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/tv-shows")({
  component: () => <Outlet />,
});
