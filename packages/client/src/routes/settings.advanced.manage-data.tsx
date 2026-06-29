import { createFileRoute } from "@tanstack/react-router";

import { OrphanCleanupCard } from "../components/OrphanCleanupCard";

export const Route = createFileRoute("/settings/advanced/manage-data")({
  component: ManageDataPage,
});

function ManageDataPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Manage Data</h2>
        <p className="text-sm text-muted-foreground">
          Clean up orphaned records left behind when their parent is deleted.
        </p>
      </div>
      <OrphanCleanupCard />
    </section>
  );
}
