import { createFileRoute } from "@tanstack/react-router";

import { DisplayGeneralSettings } from "../components/DisplayGeneralSettings";

export const Route = createFileRoute("/settings/display/general")({
  component: DisplayGeneralPage,
});

function DisplayGeneralPage() {
  return <DisplayGeneralSettings />;
}
