import { createFileRoute } from "@tanstack/react-router";

import { HomepageContentSettings } from "../components/HomepageContentSettings";
import { HomepageSectionsSettings } from "../components/HomepageSectionsSettings";

import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings/homepage")({
  component: HomepagePage,
});

function HomepagePage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Homepage</h2>
        <p className="text-sm text-muted-foreground">
          Configure the content and sections that appear on your homepage.
        </p>
      </div>

      <HomepageContentSettings />

      <Separator />

      <div>
        <h3 className="text-sm font-semibold">Sections</h3>
        <p className="text-xs text-muted-foreground">
          Each section shows bookmarks matching its filter, in the order you set here. Drag to
          reorder.
        </p>
      </div>
      <HomepageSectionsSettings />
    </section>
  );
}
