import { createFileRoute } from "@tanstack/react-router";

import { MediaTypeListing } from "./-mediaTypeListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: MediaTypeBookmarksTab,
});

function MediaTypeBookmarksTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MediaTypeListing
      mediaTypeSlug={mediaTypeSlug}
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
