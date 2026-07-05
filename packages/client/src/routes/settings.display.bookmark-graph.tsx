import { createFileRoute } from "@tanstack/react-router";

import { DisplayBookmarkGraphSettings } from "../components/DisplayBookmarkGraphSettings";

export const Route = createFileRoute("/settings/display/bookmark-graph")({
  component: DisplayBookmarkGraphPage,
});

function DisplayBookmarkGraphPage() {
  return <DisplayBookmarkGraphSettings />;
}
