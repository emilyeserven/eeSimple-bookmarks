import type { TabNavItem } from "../components/TabbedEntityLayout";

import { createFileRoute } from "@tanstack/react-router";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

export const Route = createFileRoute("/settings/advanced")({
  component: AdvancedLayout,
});

const advancedNav: readonly TabNavItem[] = [
  {
    to: "/settings/advanced/connectors",
    label: "Connectors",
  },
  {
    to: "/settings/advanced/manage-data",
    label: "Manage Data",
  },
  {
    to: "/settings/advanced/updates",
    label: "Updates",
  },
  {
    to: "/settings/advanced/database-usage",
    label: "Database usage",
  },
  {
    to: "/settings/advanced/manage-media",
    label: "Manage Media",
  },
] as const;

function AdvancedLayout() {
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Advanced</h2>
          <p className="text-sm text-muted-foreground">
            Connectors, data cleanup, app updates, database usage, and stored media.
          </p>
        </div>
      )}
      nav={advancedNav}
      navAriaLabel="Advanced settings sections"
    />
  );
}
