import { createFileRoute } from "@tanstack/react-router";

import { CategoryCustomProperties } from "../components/CategoryCustomProperties";
import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";

export const Route = createFileRoute("/categories/$categorySlug/edit/custom-properties")({
  component: CustomPropertiesTab,
});

function CustomPropertiesTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="Custom Properties"
      description="The custom properties this category has access to, and their default values."
    >
      {category => <CategoryCustomProperties category={category} />}
    </CategoryEditTabWrapper>
  );
}
