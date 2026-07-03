import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteTrack, useTrackBySlug } from "../hooks/useTracks";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_view")({
  component: TrackViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tracks/$trackSlug/general",
    label: "General",
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
        <div className="space-y-1">
          <Link
            to="/taxonomies/tracks"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to tracks
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Track" : (track?.name ?? "Track not found")}
            </h1>
            {track
              ? (
                <div className="flex shrink-0 items-center gap-1">
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        trackSlug,
      }}
      navAriaLabel="Track sections"
    />
  );
}
