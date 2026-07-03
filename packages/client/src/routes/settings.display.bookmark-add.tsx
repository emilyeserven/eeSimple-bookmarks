import { createFileRoute } from "@tanstack/react-router";

import { DisplayBookmarkAddSettings } from "../components/DisplayBookmarkAddSettings";

export const Route = createFileRoute("/settings/display/bookmark-add")({
  component: DisplayBookmarkAddPage,
});

function DisplayBookmarkAddPage() {
  return <DisplayBookmarkAddSettings />;
}
