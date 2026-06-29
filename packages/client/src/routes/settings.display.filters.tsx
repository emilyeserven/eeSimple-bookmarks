import { createFileRoute } from "@tanstack/react-router";

import { DisplayFiltersSettings } from "../components/DisplayFiltersSettings";

export const Route = createFileRoute("/settings/display/filters")({
  component: DisplayFiltersPage,
});

function DisplayFiltersPage() {
  return <DisplayFiltersSettings />;
}
