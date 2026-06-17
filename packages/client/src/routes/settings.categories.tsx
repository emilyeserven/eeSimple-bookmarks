import { createFileRoute } from "@tanstack/react-router";

import { CategoryManager } from "../components/CategoryManager";

export const Route = createFileRoute("/settings/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Categories own your bookmarks and group custom properties. Choose which categories and
          tags appear on the homepage, and which parent tags each category offers.
        </p>
      </div>
      <CategoryManager />
    </section>
  );
}
