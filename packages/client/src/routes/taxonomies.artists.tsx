import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Artists area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/artists")({
  component: () => <Outlet />,
});
