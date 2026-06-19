import { createFileRoute } from "@tanstack/react-router";

import { SavedFiltersManager } from "../components/SavedFiltersManager";

export const Route = createFileRoute("/settings/saved-filters")({
  component: SavedFiltersPage,
});

function SavedFiltersPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Saved Filters</h2>
        <p className="text-sm text-muted-foreground">
          Named filter presets you can apply to any bookmark listing with one click from the filter
          sidebar.
        </p>
      </div>
      <SavedFiltersManager />
    </section>
  );
}
