import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useTvShowBySlug } from "../hooks/useTvShows";
import i18n from "../i18n";
import { tvShowsApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_view")({
  component: TvShowViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function TvShowViewLayout() {
  const {
    t,
  } = useTranslation();
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
            ? t("TV show")
            : tvShow
              ? (
                <LocalizedNameLabel
                  names={tvShow.names ?? []}
                  base={tvShow.name}
                />
              )
              : t("TV show not found")}
        />
      )}
      nav={viewNav}
      params={{
        tvShowSlug,
      }}
      navAriaLabel={t("TV show sections")}
    />
  );
}
