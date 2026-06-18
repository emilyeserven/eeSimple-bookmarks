import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/custom-properties")({
  component: CustomPropertiesLayout,
});

function CustomPropertiesLayout() {
  return <Outlet />;
}
