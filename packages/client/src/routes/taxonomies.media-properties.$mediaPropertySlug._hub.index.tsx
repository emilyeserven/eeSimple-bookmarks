import { createFileRoute } from "@tanstack/react-router";

import { MediaPropertyListing } from "./-mediaPropertyListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: MediaPropertyBookmarksTab,
});

function MediaPropertyBookmarksTab() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MediaPropertyListing
      mediaPropertySlug={mediaPropertySlug}
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
