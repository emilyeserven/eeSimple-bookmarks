import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { usePodcastBySlug } from "../hooks/usePodcasts";
import i18n from "../i18n";
import { podcastsApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_view")({
  component: PodcastViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/podcasts/$podcastSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/podcasts/$podcastSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function PodcastViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    podcastSlug,
  } = Route.useParams();
  const {
    podcast, isLoading,
  } = usePodcastBySlug(podcastSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: podcast?.id,
            imagesApi: podcastsApi.images,
            queryKeyPrefix: "podcast-images",
          }}
          title={isLoading
            ? t("Podcast")
            : podcast
              ? (
                <RomanizedLabel
                  name={podcast.name}
                  romanized={podcast.romanizedName}
                />
              )
              : t("Podcast not found")}
        />
      )}
      nav={viewNav}
      params={{
        podcastSlug,
      }}
      navAriaLabel={t("Podcast sections")}
    />
  );
}
