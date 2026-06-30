import { createFileRoute } from "@tanstack/react-router";

import { LocationsSettings } from "../components/LocationsSettings";

export const Route = createFileRoute("/settings/locations")({
  component: LocationsSettingsPage,
});

function LocationsSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Locations</h2>
        <p className="text-sm text-muted-foreground">
          Choose how each place type renders on the Locations map — as a pin or an area — its color,
          whether it’s shown, and the order of levels. Apply a predefined palette across your levels or
          set each color individually. These defaults drive the map, its “Levels” overlay, and the
          sort-by-place-type option.
        </p>
      </div>
      <LocationsSettings />
    </section>
  );
}
