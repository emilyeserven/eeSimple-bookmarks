import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Relationship Types area. */
export const Route = createFileRoute("/taxonomies/relationship-types")({
  component: () => <Outlet />,
});
