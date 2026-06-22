import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { YouTubeChannelTabWrapper } from "../components/YouTubeChannelTabWrapper";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/display-rules")({
  component: DisplayRulesViewTab,
});

function DisplayRulesViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <YouTubeChannelTabWrapper
      channelSlug={channelSlug}
      title="Display Rules"
      description="Card display rules whose conditions target this YouTube channel."
    >
      {channel => <CardDisplayRulesList channelId={channel.id} />}
    </YouTubeChannelTabWrapper>
  );
}
