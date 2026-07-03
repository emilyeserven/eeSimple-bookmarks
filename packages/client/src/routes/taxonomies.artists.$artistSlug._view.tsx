import { Link, createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteArtist, useArtistBySlug } from "../hooks/useArtists";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/artists/$artistSlug/_view")({
  component: ArtistViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/artists/$artistSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/artists/$artistSlug/image",
    label: "Image",
  },
] as const;

function ArtistViewLayout() {
  const {
    artistSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    artist, isLoading,
  } = useArtistBySlug(artistSlug);
  const deleteArtist = useDeleteArtist();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/artists"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to artists
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Artist"
                : artist
                  ? (
                    <RomanizedLabel
                      name={artist.name}
                      romanized={artist.romanizedName}
                    />
                  )
                  : "Artist not found"}
            </h1>
            {artist
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/artists/$artistSlug/edit/general"
                      params={{
                        artistSlug,
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
                    disabled={deleteArtist.isPending}
                    onClick={() => deleteArtist.mutate(artist.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/artists",
                      }),
                    })}
                  >
                    {deleteArtist.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        artistSlug,
      }}
      navAriaLabel="Artist sections"
    />
  );
}
