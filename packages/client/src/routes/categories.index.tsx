import { createFileRoute } from "@tanstack/react-router";

import { AddCategoryForm } from "../components/AddCategoryForm";
import { CategoryPreviewCard } from "../components/CategoryPreviewCard";
import { useCategories } from "../hooks/useCategories";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/categories/")({
  component: CategoriesListingPage,
});

/** Browse view for the Categories taxonomy: a list with preview info; each row opens the category. */
function CategoriesListingPage() {
  const {
    data: categories, isLoading, error,
  } = useCategories();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Categories</h1>
          {categories
            ? <Badge variant="secondary">{categories.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Group bookmarks by category. Click a category to view it, or edit it for tiered tags,
          custom properties and autofill rules.
        </p>
      </div>

      <AddCategoryForm />

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet. Create one above.</p>
        : null}

      {categories && categories.length > 0
        ? (
          <ul className="space-y-2">
            {categories.map(category => (
              <CategoryPreviewCard
                key={category.id}
                category={category}
                variant="row"
              />
            ))}
          </ul>
        )
        : null}
    </section>
  );
}
