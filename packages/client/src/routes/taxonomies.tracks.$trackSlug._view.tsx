import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useTrackBySlug } from "../hooks/useTracks";
import { tracksApi } from "../lib/api/taxonomies";

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
  const {
    track, isLoading,
  } = useTrackBySlug(trackSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: track?.id,
            imagesApi: tracksApi.images,
            queryKeyPrefix: "track-images",
          }}
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
