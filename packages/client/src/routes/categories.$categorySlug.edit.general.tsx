import { createFileRoute } from "@tanstack/react-router";

import { CategoryGeneralForm } from "../components/CategoryGeneralForm";
import { useCategoryBySlug } from "../hooks/useCategories";

export const Route = createFileRoute("/categories/$categorySlug/edit/general")({
  component: GeneralTab,
});

function GeneralTab() {
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
        <h2 className="text-xl font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">
          Name, icon, and description.
        </p>
      </div>
      <CategoryGeneralForm category={category} />
    </section>
  );
}
