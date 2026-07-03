import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Movies area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/movies")({
  component: () => <Outlet />,
});
