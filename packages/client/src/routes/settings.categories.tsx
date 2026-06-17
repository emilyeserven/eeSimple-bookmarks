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
          Group custom properties into categories. Each category can carry an icon shown in the
          sidebar and a short description.
        </p>
      </div>
      <CategoryManager />
    </section>
  );
}
