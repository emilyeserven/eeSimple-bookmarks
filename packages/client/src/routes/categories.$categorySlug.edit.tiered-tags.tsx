import { createFileRoute } from "@tanstack/react-router";

import { CategoryTieredTags } from "../components/CategoryTieredTags";
import { useCategoryBySlug } from "../hooks/useCategories";

export const Route = createFileRoute("/categories/$categorySlug/edit/tiered-tags")({
  component: TieredTagsTab,
});

function TieredTagsTab() {
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
        <h2 className="text-xl font-semibold">Tiered Tags</h2>
        <p className="text-sm text-muted-foreground">
          Tiered (parent) tags scoped to this category.
        </p>
      </div>
      <CategoryTieredTags categoryId={category.id} />
    </section>
  );
}
