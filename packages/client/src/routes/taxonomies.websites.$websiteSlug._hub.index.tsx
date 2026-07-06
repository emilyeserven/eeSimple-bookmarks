import { createFileRoute } from "@tanstack/react-router";

import { WebsiteListing } from "./-websiteListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: WebsiteBookmarksTab,
});

function WebsiteBookmarksTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <WebsiteListing
      websiteSlug={websiteSlug}
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
