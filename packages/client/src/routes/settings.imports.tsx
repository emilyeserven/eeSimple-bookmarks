import { createFileRoute } from "@tanstack/react-router";

import { ImportsSettings } from "../components/ImportsSettings";

export const Route = createFileRoute("/settings/imports")({
  component: ImportSettingsPage,
});

function ImportSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Import settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage the imports blacklist and clear processed inbox items.
        </p>
      </div>
      <ImportsSettings />
    </section>
  );
}
