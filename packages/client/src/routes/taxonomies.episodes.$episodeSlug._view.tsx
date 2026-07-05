import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useEpisodeBySlug } from "../hooks/useEpisodes";
import i18n from "../i18n";
import { episodesApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_view")({
  component: EpisodeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/episodes/$episodeSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/episodes/$episodeSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function EpisodeViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    episodeSlug,
  } = Route.useParams();
  const {
    episode, isLoading,
  } = useEpisodeBySlug(episodeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: episode?.id,
            imagesApi: episodesApi.images,
            queryKeyPrefix: "episode-images",
          }}
          title={isLoading
            ? t("Episode")
            : episode
              ? (
                <RomanizedLabel
                  name={episode.name}
                  romanized={episode.romanizedName}
                />
              )
              : t("Episode not found")}
        />
      )}
      nav={viewNav}
      params={{
        episodeSlug,
      }}
      navAriaLabel={t("Episode sections")}
    />
  );
}
