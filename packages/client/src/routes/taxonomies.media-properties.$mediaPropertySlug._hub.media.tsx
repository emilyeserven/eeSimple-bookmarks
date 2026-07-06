import { createFileRoute } from "@tanstack/react-router";

import { MediaPropertyListing } from "./-mediaPropertyListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: MediaPropertyMediaTab,
});

function MediaPropertyMediaTab() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MediaPropertyListing
      mediaPropertySlug={mediaPropertySlug}
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
