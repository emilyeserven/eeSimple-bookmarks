import { createFileRoute } from "@tanstack/react-router";

import { TrackListing } from "./-trackListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: TrackMediaTab,
});

function TrackMediaTab() {
  const {
    trackSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TrackListing
      trackSlug={trackSlug}
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
