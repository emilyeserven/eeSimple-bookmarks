import { createFileRoute } from "@tanstack/react-router";

import { LocationRelationsCard } from "../components/LocationRelationsCard";

export const Route = createFileRoute("/settings/locations/location-relations")({
  component: LocationRelationsSettingsPage,
});

function LocationRelationsSettingsPage() {
  return <LocationRelationsCard />;
}
