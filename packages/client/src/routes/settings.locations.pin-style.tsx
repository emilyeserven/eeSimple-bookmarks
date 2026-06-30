import { createFileRoute } from "@tanstack/react-router";

import { LocationPinStyleSettings } from "../components/LocationPinStyleSettings";

export const Route = createFileRoute("/settings/locations/pin-style")({
  component: LocationPinStylePage,
});

function LocationPinStylePage() {
  return <LocationPinStyleSettings />;
}
