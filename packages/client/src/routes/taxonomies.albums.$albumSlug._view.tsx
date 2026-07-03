import { Link, createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteAlbum, useAlbumBySlug } from "../hooks/useAlbums";

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
        <div className="space-y-1">
          <Link
            to="/taxonomies/albums"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to albums
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Album"
                : album
                  ? (
                    <RomanizedLabel
                      name={album.name}
                      romanized={album.romanizedName}
                    />
                  )
                  : "Album not found"}
            </h1>
            {album
              ? (
                <div className="flex shrink-0 items-center gap-1">
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        albumSlug,
      }}
      navAriaLabel="Album sections"
    />
  );
}
