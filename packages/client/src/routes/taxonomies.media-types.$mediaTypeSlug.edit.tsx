import { Link, createFileRoute } from "@tanstack/react-router";

import { MediaTypeRow } from "../components/MediaTypeManager";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit")({
  component: MediaTypeEditPage,
});

function MediaTypeEditPage() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    mediaType, isLoading, error,
  } = useMediaTypeBySlug(mediaTypeSlug);

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={mediaType}
      loadingLabel="Loading media type…"
      notFoundMessage="Media type not found."
      listHref="/taxonomies/media-types"
      listLabel="Back to media types"
    >
      {mt => (
        <section className="space-y-6">
          <div className="space-y-1">
            <Link
              to="/taxonomies/media-types/$mediaTypeSlug"
              params={{
                mediaTypeSlug,
              }}
              className="
                text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to {mt.name}
            </Link>
            <h1 className="text-2xl font-bold">Edit media type</h1>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <MediaTypeRow
              mediaType={mt}
              onSaved={() => navigate({
                to: "/taxonomies/media-types",
              })}
            />
          </div>
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
