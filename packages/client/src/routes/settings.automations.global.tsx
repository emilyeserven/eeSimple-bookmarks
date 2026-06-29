import { createFileRoute } from "@tanstack/react-router";

import { AutomationsSettings } from "../components/AutomationsSettings";

export const Route = createFileRoute("/settings/automations/global")({
  component: GlobalAutomationsPage,
});

function GlobalAutomationsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Global</h2>
        <p className="text-sm text-muted-foreground">
          Automatic behaviors applied whenever you save a bookmark.
        </p>
      </div>
      <AutomationsSettings />
    </section>
  );
}
