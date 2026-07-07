import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useEpisodeBySlug } from "../hooks/useEpisodes";
import { episodesApi } from "../lib/api/taxonomies";

/**
 * The episode listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_hub")({
  component: EpisodeHubLayout,
});

function EpisodeHubLayout() {
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
    <ListingHubLayout
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
                <LocalizedNameLabel
                  names={episode.names ?? []}
                  base={episode.name}
                />
              )
              : t("Episode not found")}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/episodes/$episodeSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/episodes/$episodeSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/episodes/$episodeSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        episodeSlug,
      }}
      navAriaLabel={t("Episode sections")}
    />
  );
}
