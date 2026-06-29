import type { TabNavItem } from "../components/TabbedEntityLayout";

import { createFileRoute } from "@tanstack/react-router";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

export const Route = createFileRoute("/settings/display")({
  component: DisplayLayout,
});

const displayNav: readonly TabNavItem[] = [
  {
    to: "/settings/display/general",
    label: "General",
  },
  {
    to: "/settings/display/media",
    label: "Media",
  },
  {
    to: "/settings/display/sidebar",
    label: "Sidebar",
  },
  {
    to: "/settings/display/filters",
    label: "Filters",
  },
  {
    to: "/settings/display/drawer",
    label: "Drawer",
  },
  {
    to: "/settings/display/homepage",
    label: "Homepage",
  },
] as const;

function DisplayLayout() {
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Display</h2>
          <p className="text-sm text-muted-foreground">
            Personalize how the app looks.
          </p>
        </div>
      )}
      nav={displayNav}
      navAriaLabel="Display settings sections"
    />
  );
}
