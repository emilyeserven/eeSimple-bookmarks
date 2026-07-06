import { createFileRoute } from "@tanstack/react-router";

import { GroupListing } from "./-groupListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: GroupBookmarksTab,
});

function GroupBookmarksTab() {
  const {
    groupSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <GroupListing
      groupSlug={groupSlug}
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
