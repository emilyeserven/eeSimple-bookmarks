import { createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { YouTubeChannelGeneralForm } from "../components/YouTubeChannelGeneralForm";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    channelSlug,
  } = Route.useParams();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);
  return (
    <TabWrapper
      entity={channel}
      isLoading={isLoading}
      notFoundMessage="Channel not found."
      title="General"
      description="Channel name."
    >
      {ch => <YouTubeChannelGeneralForm channel={ch} />}
    </TabWrapper>
  );
}
