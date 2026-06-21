import { createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { TagGeneralForm } from "../components/TagGeneralForm";
import { useTagBySlug } from "../hooks/useTags";
import { subtreeIds } from "../lib/tagTree";

export const Route = createFileRoute("/tags/$tagSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, data, isLoading,
  } = useTagBySlug(tagSlug);

  return (
    <TabWrapper
      entity={tag}
      isLoading={isLoading}
      notFoundMessage="Tag not found."
      title="General"
      description="Name and parent tag."
    >
      {node => (
        <TagGeneralForm
          node={node}
          allTags={data ?? []}
          forbiddenIds={new Set(subtreeIds(node))}
        />
      )}
    </TabWrapper>
  );
}
