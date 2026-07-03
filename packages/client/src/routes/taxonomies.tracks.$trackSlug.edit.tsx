import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTrackBySlug } from "../hooks/useTracks";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/edit")({
  component: TrackEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/tracks/$trackSlug/edit/general",
    label: "General",
  },
] as const;

function TrackEditLayout() {
  const {
    trackSlug,
  } = Route.useParams();
  const {
    track, isLoading,
  } = useTrackBySlug(trackSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/tracks/$trackSlug"
            params={{
              trackSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "track" : (track?.name ?? "track")}
          </Link>
          <h1 className="text-2xl font-bold">Edit track</h1>
        </div>
      )}
      nav={editNav}
      params={{
        trackSlug,
      }}
      navAriaLabel="Track edit sections"
    />
  );
}
