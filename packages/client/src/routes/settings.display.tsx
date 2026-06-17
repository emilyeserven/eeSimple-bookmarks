import { createFileRoute } from "@tanstack/react-router";

import { DisplaySettings } from "../components/DisplaySettings";

export const Route = createFileRoute("/settings/display")({
  component: DisplayPage,
});

function DisplayPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Display</h2>
        <p className="text-sm text-muted-foreground">
          Personalize how the app looks.
        </p>
      </div>
      <DisplaySettings />
    </section>
  );
}
