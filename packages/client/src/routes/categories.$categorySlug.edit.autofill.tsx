import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";

export const Route = createFileRoute("/categories/$categorySlug/edit/autofill")({
  component: AutofillTab,
});

function AutofillTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="Autofill Rules"
      description="Autofill rules that add matching bookmarks to this category. New rules created here target this category by default."
    >
      {category => <AutofillRulesList categoryId={category.id} />}
    </CategoryEditTabWrapper>
  );
}
