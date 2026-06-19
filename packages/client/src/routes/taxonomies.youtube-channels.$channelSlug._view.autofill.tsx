import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { YouTubeChannelTabWrapper } from "../components/YouTubeChannelTabWrapper";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <YouTubeChannelTabWrapper
      channelSlug={channelSlug}
      title="Autofill Rules"
      description="Autofill rules that target this YouTube channel."
    >
      {channel => <AutofillRulesList channelId={channel.id} />}
    </YouTubeChannelTabWrapper>
  );
}
