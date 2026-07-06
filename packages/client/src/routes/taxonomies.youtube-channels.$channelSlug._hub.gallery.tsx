import { createFileRoute } from "@tanstack/react-router";

import { YouTubeChannelListing } from "./-youtubeChannelListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: YouTubeChannelGalleryTab,
});

function YouTubeChannelGalleryTab() {
  const {
    channelSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <YouTubeChannelListing
      channelSlug={channelSlug}
      activeView="gallery"
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
