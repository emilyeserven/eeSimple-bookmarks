import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";

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
      {category => <AutofillRulesList categoryId={category.id} />}
    </CategoryEditTabWrapper>
  );
}
