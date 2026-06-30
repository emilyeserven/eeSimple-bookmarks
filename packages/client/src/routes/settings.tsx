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
    to: "/settings/automations",
    label: "Automations",
  },
  {
    to: "/settings/locations",
    label: "Locations",
  },
  {
    to: "/settings/extension",
    label: "Extension",
  },
  {
    to: "/settings/advanced",
    label: "Advanced",
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
