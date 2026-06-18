import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Media Types taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/media-types")({
  component: () => <Outlet />,
});
