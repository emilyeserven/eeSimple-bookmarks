import { Link, createFileRoute } from "@tanstack/react-router";

import { TagForm } from "../components/TagForm";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { useTagBySlug, useUpdateTag } from "../hooks/useTags";
import { subtreeIds } from "../lib/tagTree";

export const Route = createFileRoute("/tags/$tagSlug/edit")({
  component: TagEditPage,
});

function TagEditPage() {
  const {
    tagSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    tag, data, isLoading, error,
  } = useTagBySlug(tagSlug);
  const updateTag = useUpdateTag();

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={tag}
      loadingLabel="Loading tag…"
      notFoundMessage="Tag not found."
      listHref="/tags"
      listLabel="Back to tags"
    >
      {node => (
        <section className="space-y-6">
          <div className="space-y-1">
            <Link
              to="/tags"
              className="
                text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to tags
            </Link>
            <h1 className="text-2xl font-bold">Edit tag</h1>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <TagForm
              allTags={data ?? []}
              // A tag cannot be reparented under itself or any of its descendants.
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
                  onSuccess: () => navigate({
                    to: "/tags",
                  }),
                },
              )}
            />
          </div>
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
