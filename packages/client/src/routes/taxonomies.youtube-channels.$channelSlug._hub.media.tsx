import { createFileRoute } from "@tanstack/react-router";

import { YouTubeChannelListing } from "./-youtubeChannelListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_hub/media")({
  validateSearch: validateBookmarkSearch,
  component: YouTubeChannelMediaTab,
});

function YouTubeChannelMediaTab() {
  const {
    channelSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <YouTubeChannelListing
      channelSlug={channelSlug}
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
