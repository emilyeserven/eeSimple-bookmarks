import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single channel: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug")({
  component: YouTubeChannelLayout,
});

function YouTubeChannelLayout() {
  return <Outlet />;
}
