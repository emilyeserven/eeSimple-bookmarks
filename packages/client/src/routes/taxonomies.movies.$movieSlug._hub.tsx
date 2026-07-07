import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useMovieBySlug } from "../hooks/useMovies";
import { moviesApi } from "../lib/api/taxonomies";

/**
 * The movie listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_hub")({
  component: MovieHubLayout,
});

function MovieHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    movieSlug,
  } = Route.useParams();
  const {
    movie, isLoading,
  } = useMovieBySlug(movieSlug);

  return (
    <ListingHubLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: movie?.id,
            imagesApi: moviesApi.images,
            queryKeyPrefix: "movie-images",
          }}
          title={isLoading
            ? t("Movie")
            : movie
              ? (
                <LocalizedNameLabel
                  names={movie.names ?? []}
                  base={movie.name}
                />
              )
              : t("Movie not found")}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/movies/$movieSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/movies/$movieSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/movies/$movieSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        movieSlug,
      }}
      navAriaLabel={t("Movie sections")}
    />
  );
}
