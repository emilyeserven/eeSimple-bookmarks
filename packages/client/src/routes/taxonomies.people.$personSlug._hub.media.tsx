import { createFileRoute } from "@tanstack/react-router";

import { PersonListing } from "./-personListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: PersonMediaTab,
});

function PersonMediaTab() {
  const {
    personSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PersonListing
      personSlug={personSlug}
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
