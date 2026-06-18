import { Outlet, createFileRoute } from "@tanstack/react-router";

/**
 * Layout for the Custom Properties settings section: the searchable listing and each property's
 * view/edit page render through this outlet.
 */
export const Route = createFileRoute("/settings/custom-properties")({
  component: CustomPropertiesLayout,
});

function CustomPropertiesLayout() {
  return <Outlet />;
}
