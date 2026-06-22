import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { YouTubeChannelTabWrapper } from "../components/YouTubeChannelTabWrapper";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/display-rules")({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <YouTubeChannelTabWrapper
      channelSlug={channelSlug}
      title="Display Rules"
      description="Card display rules whose conditions target this YouTube channel. New rules created here target this channel by default."
    >
      {channel => <CardDisplayRulesList channelId={channel.id} />}
    </YouTubeChannelTabWrapper>
  );
}
