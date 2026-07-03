import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Episodes area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/episodes")({
  component: () => <Outlet />,
});
