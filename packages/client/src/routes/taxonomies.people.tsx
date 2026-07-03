import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the People taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/people")({
  component: () => <Outlet />,
});
