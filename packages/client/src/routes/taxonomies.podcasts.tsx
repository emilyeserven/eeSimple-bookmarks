import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Podcasts area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/podcasts")({
  component: () => <Outlet />,
});
