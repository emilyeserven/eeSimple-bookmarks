import { createFileRoute } from "@tanstack/react-router";

import { LocationLevelGroupsSettings } from "../components/LocationLevelGroupsSettings";

export const Route = createFileRoute("/settings/locations/level-groups")({
  component: LocationLevelGroupsPage,
});

function LocationLevelGroupsPage() {
  return <LocationLevelGroupsSettings />;
}
