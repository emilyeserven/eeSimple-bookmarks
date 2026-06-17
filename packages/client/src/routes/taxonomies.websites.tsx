import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Websites taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/websites")({
  component: () => <Outlet />,
});
