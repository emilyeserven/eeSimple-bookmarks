import { createFileRoute } from "@tanstack/react-router";

import { ScreenshotDefaultsSettings } from "../components/ScreenshotDefaultsSettings";

export const Route = createFileRoute("/settings/media/screenshot-defaults")({
  component: ScreenshotDefaultsPage,
});

function ScreenshotDefaultsPage() {
  return <ScreenshotDefaultsSettings />;
}
