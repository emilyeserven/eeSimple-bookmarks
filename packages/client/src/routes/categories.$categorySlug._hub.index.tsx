import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "./-categoryListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/categories/$categorySlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: CategoryBookmarksTab,
});

function CategoryBookmarksTab() {
  const {
    categorySlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CategoryListing
      categorySlug={categorySlug}
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
