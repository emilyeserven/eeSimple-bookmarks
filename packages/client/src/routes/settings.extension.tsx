import { createFileRoute } from "@tanstack/react-router";

import { ExtensionSettings } from "../components/ExtensionSettings";

export const Route = createFileRoute("/settings/extension")({
  component: ExtensionPage,
});

function ExtensionPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Extension</h2>
        <p className="text-sm text-muted-foreground">
          Save the page you’re on straight to eeSimple with a one-click bookmarklet.
        </p>
      </div>
      <ExtensionSettings />
    </section>
  );
}
