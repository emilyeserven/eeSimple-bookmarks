import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Property Groups area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/property-groups")({
  component: () => <Outlet />,
});
