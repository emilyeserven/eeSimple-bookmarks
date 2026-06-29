import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Locations taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/locations")({
  component: () => <Outlet />,
});
