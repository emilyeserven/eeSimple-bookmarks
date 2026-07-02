import { createFileRoute } from "@tanstack/react-router";

import { VerticalTabbedLayout } from "../components/VerticalTabbedLayout";

import { advancedNav } from "@/lib/settingsNav";

export const Route = createFileRoute("/settings/advanced")({
  component: AdvancedLayout,
});

function AdvancedLayout() {
  return (
    <VerticalTabbedLayout
      header={(
        <div>
          <h2 className="text-xl font-semibold">Advanced</h2>
          <p className="text-sm text-muted-foreground">
            Connectors, data cleanup, app updates, and database usage.
          </p>
        </div>
      )}
      nav={advancedNav}
      navAriaLabel="Advanced settings sections"
    />
  );
}
