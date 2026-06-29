import { createFileRoute } from "@tanstack/react-router";

import { DisplayMediaSettings } from "../components/DisplayMediaSettings";

export const Route = createFileRoute("/settings/display/media")({
  component: DisplayMediaPage,
});

function DisplayMediaPage() {
  return <DisplayMediaSettings />;
}
