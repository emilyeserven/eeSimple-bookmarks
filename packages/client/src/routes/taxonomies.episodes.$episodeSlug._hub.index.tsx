import { createFileRoute } from "@tanstack/react-router";

import { EpisodeListing } from "./-episodeListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: EpisodeBookmarksTab,
});

function EpisodeBookmarksTab() {
  const {
    episodeSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <EpisodeListing
      episodeSlug={episodeSlug}
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
