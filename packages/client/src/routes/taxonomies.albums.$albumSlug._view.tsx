import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteAlbum, useAlbumBySlug } from "../hooks/useAlbums";
import { albumsApi } from "../lib/api/taxonomies";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/_view")({
  component: AlbumViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/albums/$albumSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/albums/$albumSlug/image",
    label: "Image",
  },
] as const;

function AlbumViewLayout() {
  const {
    albumSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    album, isLoading,
  } = useAlbumBySlug(albumSlug);
  const deleteAlbum = useDeleteAlbum();

  return (
    <TabbedEntityLayout
      header={(
        <PlexTaxonomyViewHeader
          ownerId={album?.id}
          imagesApi={albumsApi.images}
          queryKeyPrefix="album-images"
          backLink={(
            <Link
              to="/taxonomies/albums"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to albums
            </Link>
          )}
          title={isLoading
            ? "Album"
            : album
              ? (
                <RomanizedLabel
                  name={album.name}
                  romanized={album.romanizedName}
                />
              )
              : "Album not found"}
          actions={album
            ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    to="/taxonomies/albums/$albumSlug/edit/general"
                    params={{
                      albumSlug,
                    }}
                  >
                    Edit
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="
                    text-destructive
                    hover:text-destructive
                  "
                  disabled={deleteAlbum.isPending}
                  onClick={() => deleteAlbum.mutate(album.id, {
                    onSuccess: () => navigate({
                      to: "/taxonomies/albums",
                    }),
                  })}
                >
                  {deleteAlbum.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )
            : undefined}
        />
      )}
      nav={viewNav}
      params={{
        albumSlug,
      }}
      navAriaLabel="Album sections"
    />
  );
}
