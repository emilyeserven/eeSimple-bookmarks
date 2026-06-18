import { createFileRoute } from "@tanstack/react-router";

import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";
import { CategoryGeneralFields } from "../components/CategoryPreviewCard";

export const Route = createFileRoute("/categories/$categorySlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="General"
      description="Name, icon, description, and other details."
    >
      {category => <CategoryGeneralFields category={category} />}
    </CategoryEditTabWrapper>
  );
}
