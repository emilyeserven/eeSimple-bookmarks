import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useEpisodeBySlug } from "../hooks/useEpisodes";
import { episodesApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_view")({
  component: EpisodeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/episodes/$episodeSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/episodes/$episodeSlug/image",
    label: "Image",
  },
] as const;

function EpisodeViewLayout() {
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
            ? "Episode"
            : episode
              ? (
                <RomanizedLabel
                  name={episode.name}
                  romanized={episode.romanizedName}
                />
              )
              : "Episode not found"}
        />
      )}
      nav={viewNav}
      params={{
        episodeSlug,
      }}
      navAriaLabel="Episode sections"
    />
  );
}
