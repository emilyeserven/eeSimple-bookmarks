import { createFileRoute } from "@tanstack/react-router";

import { CustomPropertyManager } from "../components/CustomPropertyManager";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Define custom properties to attach to bookmarks. Each property becomes a filter on the
          bookmarks page — a combobox for tiered tags, a range slider for numbers.
        </p>
      </div>
      <CustomPropertyManager />
    </section>
  );
}
