import { Link, createFileRoute } from "@tanstack/react-router";

import { CategoryPreviewCard } from "../components/CategoryPreviewCard";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { useCategoryBySlug } from "../hooks/useCategories";

export const Route = createFileRoute("/categories/$categorySlug/settings")({
  component: CategorySettingsPage,
});

/** Read-only view of a single category — a view version of its edit/general form. */
function CategorySettingsPage() {
  const {
    categorySlug,
  } = Route.useParams();
  const {
    category, isLoading, error,
  } = useCategoryBySlug(categorySlug);

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={category}
      loadingLabel="Loading category…"
      notFoundMessage="Category not found."
      listHref="/categories"
      listLabel="Back to categories"
    >
      {cat => (
        <section className="space-y-4">
          <Link
            to="/categories"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to categories
          </Link>
          <CategoryPreviewCard category={cat} />
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
