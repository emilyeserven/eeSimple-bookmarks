import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteTrack, useTrackBySlug } from "../hooks/useTracks";
import { tracksApi } from "../lib/api/taxonomies";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_view")({
  component: TrackViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tracks/$trackSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/tracks/$trackSlug/image",
    label: "Image",
  },
] as const;

function TrackViewLayout() {
  const {
    trackSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    track, isLoading,
  } = useTrackBySlug(trackSlug);
  const deleteTrack = useDeleteTrack();

  return (
    <TabbedEntityLayout
      header={(
        <PlexTaxonomyViewHeader
          ownerId={track?.id}
          imagesApi={tracksApi.images}
          queryKeyPrefix="track-images"
          backLink={(
            <Link
              to="/taxonomies/tracks"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to tracks
            </Link>
          )}
          title={isLoading
            ? "Track"
            : track
              ? (
                <RomanizedLabel
                  name={track.name}
                  romanized={track.romanizedName}
                />
              )
              : "Track not found"}
          actions={track
            ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    to="/taxonomies/tracks/$trackSlug/edit/general"
                    params={{
                      trackSlug,
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
                  disabled={deleteTrack.isPending}
                  onClick={() => deleteTrack.mutate(track.id, {
                    onSuccess: () => navigate({
                      to: "/taxonomies/tracks",
                    }),
                  })}
                >
                  {deleteTrack.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )
            : undefined}
        />
      )}
      nav={viewNav}
      params={{
        trackSlug,
      }}
      navAriaLabel="Track sections"
    />
  );
}
