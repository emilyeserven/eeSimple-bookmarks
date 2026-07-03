import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useTvShowBySlug } from "../hooks/useTvShows";
import { tvShowsApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_view")({
  component: TvShowViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/image",
    label: "Image",
  },
] as const;

function TvShowViewLayout() {
  const {
    tvShowSlug,
  } = Route.useParams();
  const {
    tvShow, isLoading,
  } = useTvShowBySlug(tvShowSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: tvShow?.id,
            imagesApi: tvShowsApi.images,
            queryKeyPrefix: "tvShow-images",
          }}
          title={isLoading
            ? "TV show"
            : tvShow
              ? (
                <RomanizedLabel
                  name={tvShow.name}
                  romanized={tvShow.romanizedName}
                />
              )
              : "TV show not found"}
        />
      )}
      nav={viewNav}
      params={{
        tvShowSlug,
      }}
      navAriaLabel="TV show sections"
    />
  );
}
