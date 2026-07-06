import { createFileRoute } from "@tanstack/react-router";

import { TagListing } from "./-tagListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/tags/$tagSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: TagMediaTab,
});

function TagMediaTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TagListing
      tagSlug={tagSlug}
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
