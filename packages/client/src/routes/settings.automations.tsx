import { createFileRoute } from "@tanstack/react-router";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

import { automationsNav } from "@/lib/settingsNav";

export const Route = createFileRoute("/settings/automations")({
  component: AutomationsLayout,
});

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
