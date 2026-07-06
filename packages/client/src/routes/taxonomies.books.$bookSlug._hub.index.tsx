import { createFileRoute } from "@tanstack/react-router";

import { BookListing } from "./-bookListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: BookBookmarksTab,
});

function BookBookmarksTab() {
  const {
    bookSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <BookListing
      bookSlug={bookSlug}
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
