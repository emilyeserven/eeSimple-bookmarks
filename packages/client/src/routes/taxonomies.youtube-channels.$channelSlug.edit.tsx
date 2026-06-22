import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit")({
  component: YouTubeChannelEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/youtube-channels/$channelSlug/edit/autofill",
    label: "Autofill",
  },
  {
    to: "/taxonomies/youtube-channels/$channelSlug/edit/display-rules",
    label: "Display Rules",
  },
] as const;

function YouTubeChannelEditLayout() {
  const {
    channelSlug,
  } = Route.useParams();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/youtube-channels/$channelSlug"
            params={{
              channelSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "channel" : (channel?.name ?? "channel")}
          </Link>
          <h1 className="text-2xl font-bold">Edit channel</h1>
        </div>
      )}
      nav={editNav}
      params={{
        channelSlug,
      }}
      navAriaLabel="Channel edit sections"
    />
  );
}
