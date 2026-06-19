import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { TagTabWrapper } from "../components/TagTabWrapper";

export const Route = createFileRoute("/tags/$tagSlug/edit/autofill")({
  component: AutofillEditTab,
});

function AutofillEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <TagTabWrapper
      tagSlug={tagSlug}
      title="Autofill Rules"
      description="Autofill rules that apply this tag to matching bookmarks. New rules created here apply this tag by default."
    >
      {tag => <AutofillRulesList tagId={tag.id} />}
    </TagTabWrapper>
  );
}
