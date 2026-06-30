import { createFileRoute } from "@tanstack/react-router";

import { BackfillSettings } from "../components/BackfillSettings";

export const Route = createFileRoute("/settings/automations/backfill")({
  component: BackfillAutomationsPage,
});

function BackfillAutomationsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Backfill</h2>
        <p className="text-sm text-muted-foreground">
          One-off scans over existing bookmarks and YouTube channels.
        </p>
      </div>
      <BackfillSettings />
    </section>
  );
}
