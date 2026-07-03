import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useAlbumBySlug } from "../hooks/useAlbums";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/edit")({
  component: AlbumEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/albums/$albumSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/albums/$albumSlug/edit/image",
    label: "Image",
  },
] as const;

function AlbumEditLayout() {
  const {
    albumSlug,
  } = Route.useParams();
  const {
    album, isLoading,
  } = useAlbumBySlug(albumSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/albums/$albumSlug"
            params={{
              albumSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "album" : (album?.name ?? "album")}
          </Link>
          <h1 className="text-2xl font-bold">Edit album</h1>
        </div>
      )}
      nav={editNav}
      params={{
        albumSlug,
      }}
      navAriaLabel="Album edit sections"
    />
  );
}
