import { createFileRoute } from "@tanstack/react-router";

import { TagListing } from "./-tagListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/tags/$tagSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: TagBookmarksTab,
});

function TagBookmarksTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TagListing
      tagSlug={tagSlug}
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
