import { createFileRoute } from "@tanstack/react-router";

import { GenreMoodListing } from "./-genreMoodListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: GenreMoodBookmarksTab,
});

function GenreMoodBookmarksTab() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <GenreMoodListing
      genreMoodSlug={genreMoodSlug}
      activeView="bookmarks"
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
