import { createFileRoute } from "@tanstack/react-router";

import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";
import { CategoryGeneralFields } from "../components/CategoryPreviewCard";
import { EntityAutofillSources } from "../components/EntityAutofillSources";

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
      {category => (
        <div className="space-y-6">
          <CategoryGeneralFields category={category} />
          <EntityAutofillSources
            match={{
              kind: "category",
              categoryId: category.id,
            }}
          />
        </div>
      )}
    </CategoryEditTabWrapper>
  );
}
