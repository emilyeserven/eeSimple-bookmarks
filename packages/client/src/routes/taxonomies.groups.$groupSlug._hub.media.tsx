import { createFileRoute } from "@tanstack/react-router";

import { GroupListing } from "./-groupListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: GroupMediaTab,
});

function GroupMediaTab() {
  const {
    groupSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <GroupListing
      groupSlug={groupSlug}
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
