import { createFileRoute } from "@tanstack/react-router";

import { AdvancedSettings } from "../components/AdvancedSettings";

export const Route = createFileRoute("/settings/advanced")({
  component: AdvancedPage,
});

function AdvancedPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Advanced</h2>
        <p className="text-sm text-muted-foreground">
          Opt-in sidebar links to the Coolify instance, the API docs, and Storybook, plus a
          summary of how much disk space the database is using.
        </p>
      </div>
      <AdvancedSettings />
    </section>
  );
}
