import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { usePodcastBySlug } from "../hooks/usePodcasts";
import { podcastsApi } from "../lib/api/taxonomies";

/**
 * The podcast listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_hub")({
  component: PodcastHubLayout,
});

function PodcastHubLayout() {
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
    <ListingHubLayout
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
                <LocalizedNameLabel
                  names={podcast.names ?? []}
                  base={podcast.name}
                />
              )
              : t("Podcast not found")}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/podcasts/$podcastSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/podcasts/$podcastSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/podcasts/$podcastSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/podcasts/$podcastSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        podcastSlug,
      }}
      navAriaLabel={t("Podcast sections")}
    />
  );
}
