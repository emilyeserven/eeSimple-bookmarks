import { createFileRoute } from "@tanstack/react-router";

import { PodcastListing } from "./-podcastListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: PodcastBookmarksTab,
});

function PodcastBookmarksTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PodcastListing
      podcastSlug={podcastSlug}
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
