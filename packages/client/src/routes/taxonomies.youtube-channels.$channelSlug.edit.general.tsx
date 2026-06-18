import { createFileRoute } from "@tanstack/react-router";

import { YouTubeChannelGeneralForm } from "../components/YouTubeChannelGeneralForm";
import { YouTubeChannelTabWrapper } from "../components/YouTubeChannelTabWrapper";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <YouTubeChannelTabWrapper
      channelSlug={channelSlug}
      title="General"
      description="Channel name."
    >
      {ch => <YouTubeChannelGeneralForm channel={ch} />}
    </YouTubeChannelTabWrapper>
  );
}
