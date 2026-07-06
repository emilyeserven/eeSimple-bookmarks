import { createFileRoute } from "@tanstack/react-router";

import { BookListing } from "./-bookListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: BookMediaTab,
});

function BookMediaTab() {
  const {
    bookSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <BookListing
      bookSlug={bookSlug}
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
