import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useTrackBySlug } from "../hooks/useTracks";
import { tracksApi } from "../lib/api/taxonomies";

/**
 * The track listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_hub")({
  component: TrackHubLayout,
});

function TrackHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    trackSlug,
  } = Route.useParams();
  const {
    track, isLoading,
  } = useTrackBySlug(trackSlug);

  return (
    <ListingHubLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: track?.id,
            imagesApi: tracksApi.images,
            queryKeyPrefix: "track-images",
          }}
          title={isLoading
            ? t("Track")
            : track
              ? (
                <LocalizedNameLabel
                  names={track.names ?? []}
                  base={track.name}
                />
              )
              : t("Track not found")}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/tracks/$trackSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/tracks/$trackSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/tracks/$trackSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        trackSlug,
      }}
      navAriaLabel={t("Track sections")}
    />
  );
}
