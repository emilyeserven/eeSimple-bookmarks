import { Link, createFileRoute } from "@tanstack/react-router";

import { MediaTypeCard } from "../components/MediaTypeManager";
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

  if (isLoading) {
    return <p className="text-muted-foreground">Loading media type…</p>;
  }

  if (error || !mediaType) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? "Media type not found."}</p>
        <Link
          to="/taxonomies/media-types"
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to media types
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <Link
        to="/taxonomies/media-types"
        className="
          inline-block text-sm text-muted-foreground
          hover:text-foreground
        "
      >
        ← Back to media types
      </Link>
      <MediaTypeCard mediaType={mediaType} />
      {mediaType.builtIn
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
                deleteMediaType.mutate(mediaType.id, {
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
  );
}
