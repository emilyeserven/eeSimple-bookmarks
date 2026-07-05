import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useTrackBySlug } from "../hooks/useTracks";
import i18n from "../i18n";
import { tracksApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_view")({
  component: TrackViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tracks/$trackSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/tracks/$trackSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function TrackViewLayout() {
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
            ? t("Track")
            : track
              ? (
                <RomanizedLabel
                  name={track.name}
                  romanized={track.romanizedName}
                />
              )
              : t("Track not found")}
        />
      )}
      nav={viewNav}
      params={{
        trackSlug,
      }}
      navAriaLabel={t("Track sections")}
    />
  );
}
