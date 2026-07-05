import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useMovieBySlug } from "../hooks/useMovies";
import i18n from "../i18n";
import { moviesApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_view")({
  component: MovieViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/movies/$movieSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/movies/$movieSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function MovieViewLayout() {
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
    <TabbedEntityLayout
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
                <RomanizedLabel
                  name={movie.name}
                  romanized={movie.romanizedName}
                />
              )
              : t("Movie not found")}
        />
      )}
      nav={viewNav}
      params={{
        movieSlug,
      }}
      navAriaLabel={t("Movie sections")}
    />
  );
}
