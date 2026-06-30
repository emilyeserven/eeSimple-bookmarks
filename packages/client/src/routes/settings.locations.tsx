import type { TabNavItem } from "../components/TabbedEntityLayout";

import { createFileRoute } from "@tanstack/react-router";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

export const Route = createFileRoute("/settings/locations")({
  component: LocationsLayout,
});

const locationsNav: readonly TabNavItem[] = [
  {
    to: "/settings/locations/level-groups",
    label: "Level Groups",
  },
  {
    to: "/settings/locations/pin-style",
    label: "Pin Style",
  },
  {
    to: "/settings/locations/place-types",
    label: "Place Types",
  },
] as const;

function LocationsLayout() {
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Locations</h2>
          <p className="text-sm text-muted-foreground">
            Choose how each place type renders on the Locations map — as a pin or an area — its
            color, whether it’s shown, and the order of levels. Apply a predefined palette across
            your levels or set each color individually. These defaults drive the map, its “Levels”
            overlay, and the sort-by-place-type option.
          </p>
        </div>
      )}
      nav={locationsNav}
      navAriaLabel="Locations settings sections"
    />
  );
}
