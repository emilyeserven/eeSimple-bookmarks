import { createFileRoute } from "@tanstack/react-router";

import { CustomPropertyManager } from "../components/CustomPropertyManager";

export const Route = createFileRoute("/settings/custom-properties")({
  component: CustomPropertiesPage,
});

function CustomPropertiesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Custom Properties</h2>
        <p className="text-sm text-muted-foreground">
          Define custom properties to attach to bookmarks. Each property becomes a filter on the
          bookmarks page — a combobox for tiered tags, a range slider for numbers.
        </p>
      </div>
      <CustomPropertyManager />
    </section>
  );
}
