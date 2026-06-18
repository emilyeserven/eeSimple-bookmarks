import { createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { TagForm } from "../components/TagForm";
import { useTagBySlug, useUpdateTag } from "../hooks/useTags";
import { subtreeIds } from "../lib/tagTree";

export const Route = createFileRoute("/tags/$tagSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    tag, data, isLoading,
  } = useTagBySlug(tagSlug);
  const updateTag = useUpdateTag();

  return (
    <TabWrapper
      entity={tag}
      isLoading={isLoading}
      notFoundMessage="Tag not found."
      title="General"
      description="Name and parent tag."
    >
      {node => (
        <TagForm
          allTags={data ?? []}
          forbiddenIds={new Set(subtreeIds(node))}
          defaultName={node.name}
          defaultParentId={node.parentId}
          submitLabel="Save"
          pendingLabel="Saving…"
          isError={updateTag.isError}
          errorMessage={updateTag.error?.message}
          onSubmit={({
            name, parentId,
          }) => updateTag.mutate(
            {
              id: node.id,
              input: {
                name,
                parentId,
              },
            },
            {
              onSuccess: updated => navigate({
                to: "/tags/$tagSlug/edit/general",
                params: {
                  tagSlug: updated.slug,
                },
              }),
            },
          )}
        />
      )}
    </TabWrapper>
  );
}
