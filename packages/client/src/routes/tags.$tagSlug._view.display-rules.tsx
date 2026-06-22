import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { TagTabWrapper } from "../components/TagTabWrapper";

export const Route = createFileRoute("/tags/$tagSlug/_view/display-rules")({
  component: DisplayRulesViewTab,
});

function DisplayRulesViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <TagTabWrapper
      tagSlug={tagSlug}
      title="Display Rules"
      description="Card display rules whose conditions reference this tag."
    >
      {tag => <CardDisplayRulesList tagId={tag.id} />}
    </TagTabWrapper>
  );
}
