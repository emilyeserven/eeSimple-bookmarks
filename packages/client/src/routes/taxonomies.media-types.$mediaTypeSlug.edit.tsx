import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit")({
  component: MediaTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/edit/autofill",
    label: "Autofill Rules",
  },
] as const;

function MediaTypeEditLayout() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    mediaType, isLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
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
            ← Back to {isLoading ? "media type" : (mediaType?.name ?? "media type")}
          </Link>
          <h1 className="text-2xl font-bold">Edit media type</h1>
        </div>
      )}
      nav={editNav}
      params={{
        mediaTypeSlug,
      }}
      navAriaLabel="Media type edit sections"
    />
  );
}
