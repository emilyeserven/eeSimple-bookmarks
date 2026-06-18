import { Link, createFileRoute } from "@tanstack/react-router";

import { TagPreviewCard } from "../components/TagPreviewCard";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { useTagBySlug } from "../hooks/useTags";

export const Route = createFileRoute("/tags/$tagSlug/settings")({
  component: TagSettingsPage,
});

/** Read-only view of a single tag — a view version of its edit form. */
function TagSettingsPage() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, data, isLoading, error,
  } = useTagBySlug(tagSlug);

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
        <section className="space-y-4">
          <Link
            to="/tags"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to tags
          </Link>
          <TagPreviewCard
            node={node}
            allTags={data ?? []}
          />
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
