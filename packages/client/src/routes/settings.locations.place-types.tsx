import { createFileRoute } from "@tanstack/react-router";

import { LocationPlaceTypesSettings } from "../components/LocationPlaceTypesSettings";

export const Route = createFileRoute("/settings/locations/place-types")({
  component: LocationPlaceTypesPage,
});

function LocationPlaceTypesPage() {
  return <LocationPlaceTypesSettings />;
}
