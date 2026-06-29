import { createFileRoute } from "@tanstack/react-router";

import { DisplaySidebarSettings } from "../components/DisplaySidebarSettings";

export const Route = createFileRoute("/settings/display/sidebar")({
  component: DisplaySidebarPage,
});

function DisplaySidebarPage() {
  return <DisplaySidebarSettings />;
}
