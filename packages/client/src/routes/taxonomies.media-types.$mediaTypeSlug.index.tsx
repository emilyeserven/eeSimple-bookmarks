import { Link, createFileRoute } from "@tanstack/react-router";

import { MediaTypeCard } from "../components/MediaTypeManager";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { useDeleteMediaType, useMediaTypeBySlug } from "../hooks/useMediaTypes";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/")({
  component: MediaTypeViewPage,
});

function MediaTypeViewPage() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    mediaType, isLoading, error,
  } = useMediaTypeBySlug(mediaTypeSlug);
  const deleteMediaType = useDeleteMediaType();

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
          <Link
            to="/taxonomies/media-types"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to media types
          </Link>
          <MediaTypeCard mediaType={mt} />
          {mt.builtIn
            ? null
            : (
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="
                    text-destructive
                    hover:text-destructive
                  "
                  disabled={deleteMediaType.isPending}
                  onClick={() =>
                    deleteMediaType.mutate(mt.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/media-types",
                      }),
                    })}
                >
                  {deleteMediaType.isPending ? "Deleting…" : "Delete media type"}
                </Button>
                {deleteMediaType.isError
                  ? <p className="mt-2 text-sm text-destructive">{deleteMediaType.error.message}</p>
                  : null}
              </div>
            )}
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
