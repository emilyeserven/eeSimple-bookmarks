import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { usePodcastBySlug } from "../hooks/usePodcasts";
import { podcastsApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_view")({
  component: PodcastViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/podcasts/$podcastSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/podcasts/$podcastSlug/image",
    label: "Image",
  },
] as const;

function PodcastViewLayout() {
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
            ? "Podcast"
            : podcast
              ? (
                <RomanizedLabel
                  name={podcast.name}
                  romanized={podcast.romanizedName}
                />
              )
              : "Podcast not found"}
        />
      )}
      nav={viewNav}
      params={{
        podcastSlug,
      }}
      navAriaLabel="Podcast sections"
    />
  );
}
