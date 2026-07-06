import { createFileRoute } from "@tanstack/react-router";

import { PodcastListing } from "./-podcastListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: PodcastMediaTab,
});

function PodcastMediaTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PodcastListing
      podcastSlug={podcastSlug}
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
