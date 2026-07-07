import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Location Relations taxonomy — listing, detail, and edit pages render here. */
export const Route = createFileRoute("/taxonomies/location-relations")({
  component: () => <Outlet />,
});
