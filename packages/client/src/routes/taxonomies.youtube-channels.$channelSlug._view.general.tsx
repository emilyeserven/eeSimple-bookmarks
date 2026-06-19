import { createFileRoute } from "@tanstack/react-router";
import { MonitorPlay } from "lucide-react";

import { EntityImagePreview } from "../components/EntityImageField";
import { SourceAutofillDefaults } from "../components/SourceAutofillDefaults";
import { YouTubeChannelTabWrapper } from "../components/YouTubeChannelTabWrapper";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <YouTubeChannelTabWrapper
      channelSlug={channelSlug}
      title="General"
      description="Channel details."
    >
      {ch => (
        <div className="space-y-4">
          <EntityImagePreview
            imageUrl={ch.imageUrl}
            shape="circle"
            fallback={<MonitorPlay className="size-6" />}
          />
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Added</dt>
            <dd>{new Date(ch.createdAt).toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">Channel key</dt>
            <dd>{ch.channelKey}</dd>
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono">{ch.slug}</dd>
            <dt className="text-muted-foreground">Self-identifiers</dt>
            <dd>
              {ch.selfIds.length > 0
                ? ch.selfIds.join(", ")
                : <span className="text-muted-foreground">None</span>}
            </dd>
            {ch.bookmarkCount != null
              ? (
                <>
                  <dt className="text-muted-foreground">Bookmarks</dt>
                  <dd>{ch.bookmarkCount}</dd>
                </>
              )
              : null}
          </dl>
          <SourceAutofillDefaults
            kind="channel"
            category={ch.category}
            tagIds={ch.tagIds}
          />
        </div>
      )}
    </YouTubeChannelTabWrapper>
  );
}
