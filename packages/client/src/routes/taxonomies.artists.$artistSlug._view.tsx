import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteArtist, useArtistBySlug } from "../hooks/useArtists";
import { artistsApi } from "../lib/api/taxonomies";

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
        <PlexTaxonomyViewHeader
          ownerId={artist?.id}
          imagesApi={artistsApi.images}
          queryKeyPrefix="artist-images"
          backLink={(
            <Link
              to="/taxonomies/artists"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to artists
            </Link>
          )}
          title={isLoading
            ? "Artist"
            : artist
              ? (
                <RomanizedLabel
                  name={artist.name}
                  romanized={artist.romanizedName}
                />
              )
              : "Artist not found"}
          actions={artist
            ? (
              <>
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
              </>
            )
            : undefined}
        />
      )}
      nav={viewNav}
      params={{
        artistSlug,
      }}
      navAriaLabel="Artist sections"
    />
  );
}
