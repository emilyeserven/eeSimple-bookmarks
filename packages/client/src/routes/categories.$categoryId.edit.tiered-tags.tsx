import { createFileRoute } from "@tanstack/react-router";

import { CategoryTieredTags } from "../components/CategoryTieredTags";

export const Route = createFileRoute("/categories/$categoryId/edit/tiered-tags")({
  component: TieredTagsTab,
});

function TieredTagsTab() {
  const {
    categoryId,
  } = Route.useParams();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Tiered Tags</h2>
        <p className="text-sm text-muted-foreground">
          Tiered (parent) tags scoped to this category.
        </p>
      </div>
      <CategoryTieredTags categoryId={categoryId} />
    </section>
  );
}
