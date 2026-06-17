import { createFileRoute } from "@tanstack/react-router";

import { AutomationsSettings } from "../components/AutomationsSettings";

export const Route = createFileRoute("/settings/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Automations</h2>
        <p className="text-sm text-muted-foreground">
          Configure automatic behaviors while managing bookmarks.
        </p>
      </div>
      <AutomationsSettings />
    </section>
  );
}
