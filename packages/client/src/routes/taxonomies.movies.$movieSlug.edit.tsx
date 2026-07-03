import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMovieBySlug } from "../hooks/useMovies";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/edit")({
  component: MovieEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/movies/$movieSlug/edit/general",
    label: "General",
  },
] as const;

function MovieEditLayout() {
  const {
    movieSlug,
  } = Route.useParams();
  const {
    movie, isLoading,
  } = useMovieBySlug(movieSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/movies/$movieSlug"
            params={{
              movieSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "movie" : (movie?.name ?? "movie")}
          </Link>
          <h1 className="text-2xl font-bold">Edit movie</h1>
        </div>
      )}
      nav={editNav}
      params={{
        movieSlug,
      }}
      navAriaLabel="Movie edit sections"
    />
  );
}
