import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/edit")({
  component: MediaPropertyEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
    label: "General",
  },
] as const;

function MediaPropertyEditLayout() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const {
    mediaProperty, isLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/media-properties/$mediaPropertySlug"
            params={{
              mediaPropertySlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "media property" : (mediaProperty?.name ?? "media property")}
          </Link>
          <h1 className="text-2xl font-bold">Edit media property</h1>
        </div>
      )}
      nav={editNav}
      params={{
        mediaPropertySlug,
      }}
      navAriaLabel="Media property edit sections"
    />
  );
}
