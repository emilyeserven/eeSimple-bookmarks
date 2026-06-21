import type { TabNavEntry } from "../components/TabbedEntityLayout";

import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

const settingsNav: readonly TabNavEntry[] = [
  {
    to: "/settings/display",
    label: "Display",
  },
  {
    to: "/settings/sidebar",
    label: "Drawer",
  },
  {
    to: "/settings/saved-filters",
    label: "Saved Filters",
  },
  {
    to: "/settings/homepage",
    label: "Homepage",
  },
  {
    to: "/settings/card-display-rules",
    label: "Card Display Rules",
  },
  {
    to: "/settings/gallery",
    label: "Gallery",
  },
  {
    to: "/settings/automations",
    label: "Automations",
  },
  {
    to: "/settings/link-parsing",
    label: "Link Parsing",
  },
  {
    type: "group",
    label: "More Settings",
    items: [
      {
        to: "/settings/more-categories",
        label: "Categories",
      },
      {
        to: "/settings/more-taxonomies",
        label: "Taxonomies",
      },
      {
        to: "/settings/more-customization",
        label: "Customization",
      },
    ],
  },
] as const;

function SettingsLayout() {
  return (
    <TabbedEntityLayout
      header={(
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage custom properties, display preferences, and automations.
          </p>
        </div>
      )}
      nav={settingsNav}
      navAriaLabel="Settings sections"
    />
  );
}
