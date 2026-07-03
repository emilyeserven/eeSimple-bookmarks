import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view")({
  component: YouTubeChannelViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/youtube-channels/$channelSlug/general",
    label: "General",
  },
  {
    type: "group",
    label: "Rules",
    items: [
      {
        to: "/taxonomies/youtube-channels/$channelSlug/autofill",
        label: "Autofill Rules",
      },
      {
        to: "/taxonomies/youtube-channels/$channelSlug/display-rules",
        label: "Display Rules",
      },
    ],
  },
] as const;

function YouTubeChannelViewLayout() {
  const {
    channelSlug,
  } = Route.useParams();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: channel?.imageUrl ?? null,
          }}
          title={isLoading ? "Channel" : (channel?.name ?? "Channel not found")}
          subtitle={channel?.channelKey}
        />
      )}
      nav={viewNav}
      params={{
        channelSlug,
      }}
      navAriaLabel="Channel sections"
    />
  );
}
