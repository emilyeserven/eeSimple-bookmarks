import { createFileRoute } from "@tanstack/react-router";

import { DatabaseUsageCard } from "../components/DatabaseUsageCard";
import { ProcessedItemsCard } from "../components/ImportsSettings";

export const Route = createFileRoute("/settings/advanced/database-usage")({
  component: DatabaseUsagePage,
});

function DatabaseUsagePage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Database usage</h2>
        <p className="text-sm text-muted-foreground">
          A read-only summary of how much disk space the database is using, plus a sweep of processed
          inbox items.
        </p>
      </div>
      <DatabaseUsageCard />
      <ProcessedItemsCard />
    </section>
  );
}
