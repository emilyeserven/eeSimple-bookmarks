import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";

export const Route = createFileRoute("/autofill/")({
  component: AutofillListPage,
});

function AutofillListPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Autofill Rules</h2>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s URL or title and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>
      <AutofillRulesList />
    </section>
  );
}
