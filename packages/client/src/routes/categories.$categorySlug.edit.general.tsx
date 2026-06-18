import { createFileRoute } from "@tanstack/react-router";

import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";
import { CategoryGeneralForm } from "../components/CategoryGeneralForm";

export const Route = createFileRoute("/categories/$categorySlug/edit/general")({
  component: GeneralTab,
});

function GeneralTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="General"
      description="Name, icon, and description."
    >
      {category => <CategoryGeneralForm category={category} />}
    </CategoryEditTabWrapper>
  );
}
