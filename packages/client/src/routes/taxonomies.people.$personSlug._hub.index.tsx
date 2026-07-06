import { createFileRoute } from "@tanstack/react-router";

import { PersonListing } from "./-personListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: PersonBookmarksTab,
});

function PersonBookmarksTab() {
  const {
    personSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PersonListing
      personSlug={personSlug}
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
