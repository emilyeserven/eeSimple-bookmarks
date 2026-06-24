import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Publishers taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/publishers")({
  component: () => <Outlet />,
});
