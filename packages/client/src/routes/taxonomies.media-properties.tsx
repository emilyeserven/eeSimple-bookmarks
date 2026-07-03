import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Media Properties area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/media-properties")({
  component: () => <Outlet />,
});
