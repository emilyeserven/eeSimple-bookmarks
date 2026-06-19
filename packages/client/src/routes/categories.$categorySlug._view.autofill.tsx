import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";
import { EntityAutofillSources } from "../components/EntityAutofillSources";

export const Route = createFileRoute("/categories/$categorySlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="Autofill Rules"
      description="Autofill rules that add matching bookmarks to this category."
    >
      {category => (
        <div className="space-y-6">
          <EntityAutofillSources
            match={{
              kind: "category",
              categoryId: category.id,
            }}
          />
          <AutofillRulesList categoryId={category.id} />
        </div>
      )}
    </CategoryEditTabWrapper>
  );
}
