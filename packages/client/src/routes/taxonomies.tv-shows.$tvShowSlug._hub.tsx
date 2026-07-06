import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useTvShowBySlug } from "../hooks/useTvShows";
import { tvShowsApi } from "../lib/api/taxonomies";

/**
 * The TV show listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_hub")({
  component: TvShowHubLayout,
});

function TvShowHubLayout() {
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
    <ListingHubLayout
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
      tabs={[
        {
          to: "/taxonomies/tv-shows/$tvShowSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/tv-shows/$tvShowSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/tv-shows/$tvShowSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/tv-shows/$tvShowSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        tvShowSlug,
      }}
      navAriaLabel={t("TV show sections")}
    />
  );
}
