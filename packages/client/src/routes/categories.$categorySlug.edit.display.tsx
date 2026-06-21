import { createFileRoute } from "@tanstack/react-router";

import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";
import { ListingDisplayControls } from "../components/ListingDisplayControls";

export const Route = createFileRoute("/categories/$categorySlug/edit/display")({
  component: DisplayTab,
});

function DisplayTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="Display"
      description="How this category's bookmark listing is laid out."
    >
      {() => (
        <ListingDisplayControls
          pageKey={`category:${categorySlug}`}
        />
      )}
    </CategoryEditTabWrapper>
  );
}
