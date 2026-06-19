import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { SourceAutofillDefaults } from "../components/SourceAutofillDefaults";
import { YouTubeChannelTabWrapper } from "../components/YouTubeChannelTabWrapper";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/autofill")({
  component: AutofillEditTab,
});

function AutofillEditTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <YouTubeChannelTabWrapper
      channelSlug={channelSlug}
      title="Autofill Rules"
      description="Autofill rules that target this YouTube channel. New rules created here target this channel by default."
    >
      {channel => (
        <div className="space-y-6">
          <SourceAutofillDefaults
            kind="channel"
            category={channel.category}
            mediaTypeId={channel.mediaTypeId}
            tagIds={channel.tagIds}
          />
          <AutofillRulesList channelId={channel.id} />
        </div>
      )}
    </YouTubeChannelTabWrapper>
  );
}
