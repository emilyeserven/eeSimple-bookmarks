import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Albums area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/albums")({
  component: () => <Outlet />,
});
