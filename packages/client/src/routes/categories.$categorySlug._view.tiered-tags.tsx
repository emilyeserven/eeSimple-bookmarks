import { createFileRoute } from "@tanstack/react-router";

import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";
import { CategoryTieredTags } from "../components/CategoryTieredTags";

export const Route = createFileRoute("/categories/$categorySlug/_view/tiered-tags")({
  component: TieredTagsViewTab,
});

function TieredTagsViewTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="Tiered Tags"
      description="Tiered (parent) tags scoped to this category."
    >
      {category => <CategoryTieredTags categoryId={category.id} />}
    </CategoryEditTabWrapper>
  );
}
