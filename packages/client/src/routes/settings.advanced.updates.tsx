import { createFileRoute } from "@tanstack/react-router";

import { PwaUpdateCard } from "../components/PwaUpdateCard";

export const Route = createFileRoute("/settings/advanced/updates")({
  component: UpdatesPage,
});

function UpdatesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Updates</h2>
        <p className="text-sm text-muted-foreground">
          Check whether a newer version of the app is available.
        </p>
      </div>
      <PwaUpdateCard />
    </section>
  );
}
