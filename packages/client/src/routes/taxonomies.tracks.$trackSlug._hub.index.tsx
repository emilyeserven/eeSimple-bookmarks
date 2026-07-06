import { createFileRoute } from "@tanstack/react-router";

import { TrackListing } from "./-trackListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: TrackBookmarksTab,
});

function TrackBookmarksTab() {
  const {
    trackSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TrackListing
      trackSlug={trackSlug}
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
