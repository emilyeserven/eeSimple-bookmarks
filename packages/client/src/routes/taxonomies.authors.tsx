import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Authors taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/authors")({
  component: () => <Outlet />,
});
