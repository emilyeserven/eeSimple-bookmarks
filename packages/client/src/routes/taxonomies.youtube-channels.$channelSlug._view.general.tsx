import { createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
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
      description="Channel details."
    >
      {ch => (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Added</dt>
          <dd>{new Date(ch.createdAt).toLocaleDateString()}</dd>
          <dt className="text-muted-foreground">Channel key</dt>
          <dd>{ch.channelKey}</dd>
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono">{ch.slug}</dd>
          {ch.bookmarkCount != null
            ? (
              <>
                <dt className="text-muted-foreground">Bookmarks</dt>
                <dd>{ch.bookmarkCount}</dd>
              </>
            )
            : null}
        </dl>
      )}
    </TabWrapper>
  );
}
