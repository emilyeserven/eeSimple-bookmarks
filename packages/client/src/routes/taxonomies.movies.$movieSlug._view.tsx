import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useMovieBySlug } from "../hooks/useMovies";
import { moviesApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_view")({
  component: MovieViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/movies/$movieSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/movies/$movieSlug/image",
    label: "Image",
  },
] as const;

function MovieViewLayout() {
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
            ? "Movie"
            : movie
              ? (
                <RomanizedLabel
                  name={movie.name}
                  romanized={movie.romanizedName}
                />
              )
              : "Movie not found"}
        />
      )}
      nav={viewNav}
      params={{
        movieSlug,
      }}
      navAriaLabel="Movie sections"
    />
  );
}
