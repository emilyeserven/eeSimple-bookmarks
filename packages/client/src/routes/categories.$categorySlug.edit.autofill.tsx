import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesManager } from "../components/AutofillRulesManager";
import { useCategoryBySlug } from "../hooks/useCategories";

export const Route = createFileRoute("/categories/$categorySlug/edit/autofill")({
  component: AutofillTab,
});

function AutofillTab() {
  const {
    categorySlug,
  } = Route.useParams();
  const {
    category, isLoading,
  } = useCategoryBySlug(categorySlug);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!category) return <p className="text-destructive">Category not found.</p>;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Autofill</h2>
        <p className="text-sm text-muted-foreground">
          Autofill rules that add matching bookmarks to this category. New rules created here
          target this category by default.
        </p>
      </div>
      <AutofillRulesManager categoryId={category.id} />
    </section>
  );
}
