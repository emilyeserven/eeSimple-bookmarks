import { createFileRoute } from "@tanstack/react-router";

import { DisplayMediaSettings } from "../components/DisplayMediaSettings";

export const Route = createFileRoute("/settings/media/display")({
  component: MediaDisplayPage,
});

function MediaDisplayPage() {
  return <DisplayMediaSettings />;
}
