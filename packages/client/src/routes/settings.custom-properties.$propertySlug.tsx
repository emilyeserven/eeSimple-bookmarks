import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single custom property: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/settings/custom-properties/$propertySlug")({
  component: CustomPropertyLayout,
});

function CustomPropertyLayout() {
  return <Outlet />;
}
