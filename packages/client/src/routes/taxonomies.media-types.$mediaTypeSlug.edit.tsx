import { Link, createFileRoute } from "@tanstack/react-router";

import { MediaTypeRow } from "../components/MediaTypeManager";
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
          ← Back to {mediaType.name}
        </Link>
        <h1 className="text-2xl font-bold">Edit media type</h1>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <MediaTypeRow
          mediaType={mediaType}
          onSaved={() => navigate({
            to: "/taxonomies/media-types",
          })}
        />
      </div>
    </section>
  );
}
