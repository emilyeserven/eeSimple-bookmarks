import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { TagTabWrapper } from "../components/TagTabWrapper";

export const Route = createFileRoute("/tags/$tagSlug/edit/display-rules")({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <TagTabWrapper
      tagSlug={tagSlug}
      title="Display Rules"
      description="Card display rules whose conditions reference this tag. New rules created here reference this tag by default."
    >
      {tag => <CardDisplayRulesList tagId={tag.id} />}
    </TagTabWrapper>
  );
}
