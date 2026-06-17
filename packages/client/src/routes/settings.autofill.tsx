import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesManager } from "../components/AutofillRulesManager";

export const Route = createFileRoute("/settings/autofill")({
  component: AutofillPage,
});

function AutofillPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Autofill</h2>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark’s URL or title and prefill its category, tags, and
          custom properties when you add it. You can always edit the suggested values before saving.
        </p>
      </div>
      <AutofillRulesManager />
    </section>
  );
}
