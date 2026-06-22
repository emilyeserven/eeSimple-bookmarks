import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Newsletters taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/newsletters")({
  component: () => <Outlet />,
});
