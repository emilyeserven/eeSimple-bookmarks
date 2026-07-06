import { createFileRoute } from "@tanstack/react-router";

import { YouTubeChannelListing } from "./-youtubeChannelListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_hub/")({
  validateSearch: validateBookmarkSearch,
  component: YouTubeChannelBookmarksTab,
});

function YouTubeChannelBookmarksTab() {
  const {
    channelSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <YouTubeChannelListing
      channelSlug={channelSlug}
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
