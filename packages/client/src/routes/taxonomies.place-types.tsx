import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Place Types taxonomy — listing, detail, and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/place-types")({
  component: () => <Outlet />,
});
