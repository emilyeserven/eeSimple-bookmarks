import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteMovie, useMovieBySlug } from "../hooks/useMovies";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_view")({
  component: MovieViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/movies/$movieSlug/general",
    label: "General",
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
        <div className="space-y-1">
          <Link
            to="/taxonomies/movies"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to movies
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Movie" : (movie?.name ?? "Movie not found")}
            </h1>
            {movie
              ? (
                <div className="flex shrink-0 items-center gap-1">
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        movieSlug,
      }}
      navAriaLabel="Movie sections"
    />
  );
}
