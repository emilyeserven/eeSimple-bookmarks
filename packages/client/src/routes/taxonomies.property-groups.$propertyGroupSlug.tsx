import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single property group: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug")({
  component: PropertyGroupLayout,
});

function PropertyGroupLayout() {
  return <Outlet />;
}
