import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single relationship type: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug")({
  component: RelationshipTypeLayout,
});

function RelationshipTypeLayout() {
  return <Outlet />;
}
