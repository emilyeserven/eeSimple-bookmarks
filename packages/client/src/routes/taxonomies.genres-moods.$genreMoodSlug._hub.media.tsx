import { createFileRoute } from "@tanstack/react-router";

import { GenreMoodListing } from "./-genreMoodListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: GenreMoodMediaTab,
});

function GenreMoodMediaTab() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <GenreMoodListing
      genreMoodSlug={genreMoodSlug}
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
