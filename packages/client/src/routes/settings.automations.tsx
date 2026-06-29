import type { TabNavItem } from "../components/TabbedEntityLayout";

import { createFileRoute } from "@tanstack/react-router";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

export const Route = createFileRoute("/settings/automations")({
  component: AutomationsLayout,
});

const automationsNav: readonly TabNavItem[] = [
  {
    to: "/settings/automations/global",
    label: "Global",
  },
  {
    to: "/settings/automations/link-parsing",
    label: "Link Parsing",
  },
  {
    to: "/settings/automations/check-links",
    label: "Check Links",
  },
  {
    to: "/settings/automations/redirect-failures",
    label: "Redirect failures",
  },
  {
    to: "/settings/automations/imports",
    label: "Imports",
  },
] as const;

function AutomationsLayout() {
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Automations</h2>
          <p className="text-sm text-muted-foreground">
            Configure automatic behaviors while managing bookmarks.
          </p>
        </div>
      )}
      nav={automationsNav}
      navAriaLabel="Automations settings sections"
    />
  );
}
