import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Groups taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/groups")({
  component: () => <Outlet />,
});
