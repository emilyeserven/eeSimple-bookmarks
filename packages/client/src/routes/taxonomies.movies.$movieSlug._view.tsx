import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteMovie, useMovieBySlug } from "../hooks/useMovies";
import { moviesApi } from "../lib/api/taxonomies";

import { Button } from "@/components/ui/button";

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
  const navigate = Route.useNavigate();
  const {
    movie, isLoading,
  } = useMovieBySlug(movieSlug);
  const deleteMovie = useDeleteMovie();

  return (
    <TabbedEntityLayout
      header={(
        <PlexTaxonomyViewHeader
          ownerId={movie?.id}
          imagesApi={moviesApi.images}
          queryKeyPrefix="movie-images"
          backLink={(
            <Link
              to="/taxonomies/movies"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to movies
            </Link>
          )}
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
          actions={movie
            ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    to="/taxonomies/movies/$movieSlug/edit/general"
                    params={{
                      movieSlug,
                    }}
                  >
                    Edit
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="
                    text-destructive
                    hover:text-destructive
                  "
                  disabled={deleteMovie.isPending}
                  onClick={() => deleteMovie.mutate(movie.id, {
                    onSuccess: () => navigate({
                      to: "/taxonomies/movies",
                    }),
                  })}
                >
                  {deleteMovie.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )
            : undefined}
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
