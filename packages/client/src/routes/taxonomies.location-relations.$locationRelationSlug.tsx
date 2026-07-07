import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single location relation: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug")({
  component: () => <Outlet />,
});
