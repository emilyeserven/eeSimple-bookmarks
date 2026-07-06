import { createFileRoute } from "@tanstack/react-router";

import { MovieListing } from "./-movieListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: MovieMediaTab,
});

function MovieMediaTab() {
  const {
    movieSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MovieListing
      movieSlug={movieSlug}
      activeView="media"
      search={search}
      onSearchChange={next =>
        navigate({
          search: next,
          replace: true,
          resetScroll: false,
        })}
    />
  );
}
