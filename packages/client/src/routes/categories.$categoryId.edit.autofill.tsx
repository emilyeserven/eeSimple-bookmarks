import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesManager } from "../components/AutofillRulesManager";

export const Route = createFileRoute("/categories/$categoryId/edit/autofill")({
  component: AutofillTab,
});

function AutofillTab() {
  const {
    categoryId,
  } = Route.useParams();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Autofill</h2>
        <p className="text-sm text-muted-foreground">
          Autofill rules that add matching bookmarks to this category. New rules created here
          target this category by default.
        </p>
      </div>
      <AutofillRulesManager categoryId={categoryId} />
    </section>
  );
}
