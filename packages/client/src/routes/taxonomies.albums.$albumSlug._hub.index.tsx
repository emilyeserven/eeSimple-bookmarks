import { createFileRoute } from "@tanstack/react-router";

import { AlbumListing } from "./-albumListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: AlbumBookmarksTab,
});

function AlbumBookmarksTab() {
  const {
    albumSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AlbumListing
      albumSlug={albumSlug}
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
