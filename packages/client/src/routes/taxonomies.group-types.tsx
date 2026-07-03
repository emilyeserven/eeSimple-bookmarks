import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Group Types area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/group-types")({
  component: () => <Outlet />,
});
