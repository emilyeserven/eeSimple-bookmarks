import { createFileRoute } from "@tanstack/react-router";

import { CategoryCustomProperties } from "../components/CategoryCustomProperties";
import { useCategory } from "../hooks/useCategories";

export const Route = createFileRoute("/categories/$categoryId/edit/custom-properties")({
  component: CustomPropertiesTab,
});

function CustomPropertiesTab() {
  const {
    categoryId,
  } = Route.useParams();
  const {
    category, isLoading,
  } = useCategory(categoryId);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!category) return <p className="text-destructive">Category not found.</p>;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Custom Properties</h2>
        <p className="text-sm text-muted-foreground">
          The custom properties this category has access to, and their default values.
        </p>
      </div>
      <CategoryCustomProperties category={category} />
    </section>
  );
}
