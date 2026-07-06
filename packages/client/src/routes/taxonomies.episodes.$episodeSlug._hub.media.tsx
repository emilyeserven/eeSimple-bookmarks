import { createFileRoute } from "@tanstack/react-router";

import { EpisodeListing } from "./-episodeListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: EpisodeMediaTab,
});

function EpisodeMediaTab() {
  const {
    episodeSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <EpisodeListing
      episodeSlug={episodeSlug}
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
