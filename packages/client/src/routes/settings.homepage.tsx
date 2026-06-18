import { createFileRoute } from "@tanstack/react-router";

import { HomepageSectionsSettings } from "../components/HomepageSectionsSettings";

export const Route = createFileRoute("/settings/homepage")({
  component: HomepagePage,
});

function HomepagePage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Homepage</h2>
        <p className="text-sm text-muted-foreground">
          Define sections that appear on your homepage. Each section shows bookmarks matching its
          filter, in the order you set here. Drag to reorder.
        </p>
      </div>
      <HomepageSectionsSettings />
    </section>
  );
}
