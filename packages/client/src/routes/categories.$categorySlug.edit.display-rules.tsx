import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { CategoryEditTabWrapper } from "../components/CategoryEditTabWrapper";

export const Route = createFileRoute("/categories/$categorySlug/edit/display-rules")({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <CategoryEditTabWrapper
      categorySlug={categorySlug}
      title="Display Rules"
      description="Card display rules whose conditions match this category. New rules created here match this category by default."
    >
      {category => <CardDisplayRulesList categoryId={category.id} />}
    </CategoryEditTabWrapper>
  );
}
