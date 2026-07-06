import { createFileRoute } from "@tanstack/react-router";

import { LocationListing } from "./-locationListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: LocationBookmarksTab,
});

function LocationBookmarksTab() {
  const {
    locationSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <LocationListing
      locationSlug={locationSlug}
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
