import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";

/**
 * Settings fallback for Autofill Rules, shown in the Settings nav when the section is hidden from
 * the sidebar's Customization group. The listing links out to the top-level `/autofill` pages —
 * the section's primary home.
 */
export const Route = createFileRoute("/settings/autofill")({
  component: AutofillListPage,
});

function AutofillListPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Autofill Rules</h2>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark’s URL or title and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>
      <AutofillRulesList />
    </section>
  );
}
