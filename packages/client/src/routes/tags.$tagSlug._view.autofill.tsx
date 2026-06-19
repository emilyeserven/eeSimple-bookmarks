import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { TagTabWrapper } from "../components/TagTabWrapper";

export const Route = createFileRoute("/tags/$tagSlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <TagTabWrapper
      tagSlug={tagSlug}
      title="Autofill Rules"
      description="Autofill rules that apply this tag to matching bookmarks."
    >
      {tag => <AutofillRulesList tagId={tag.id} />}
    </TagTabWrapper>
  );
}
