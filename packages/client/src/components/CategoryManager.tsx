import { AddCategoryForm } from "./AddCategoryForm";
import { CategoryCard } from "./CategoryCard";
import { useCategories } from "../hooks/useCategories";

import { RowCard } from "@/components/ui/card";

/** Create and list categories; each row links to a category's full edit page. */
export function CategoryManager() {
  const {
    data: categories, isLoading, error,
  } = useCategories();

  return (
    <section className="space-y-6">
      <AddCategoryForm />

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(categories ?? []).map(category => (
          <RowCard
            key={category.id}
            className="p-4"
          >
            <CategoryCard category={category} />
          </RowCard>
        ))}
      </div>
    </section>
  );
}
