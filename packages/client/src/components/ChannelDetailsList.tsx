import type { YouTubeChannel } from "@eesimple/types";

import { CategoryPill } from "./CategoryPill";

/** Read-only metadata list for a channel — shared by the view card and the edit row's Details section. */
export function ChannelDetailsList({
  channel,
}: { channel: YouTubeChannel }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(channel.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Channel key</dt>
      <dd>{channel.channelKey}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd>{channel.slug}</dd>
      {channel.category
        ? (
          <>
            <dt className="text-muted-foreground">Category</dt>
            <dd>
              <CategoryPill category={channel.category} />
            </dd>
          </>
        )
        : null}
      {channel.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">Bookmarks</dt>
            <dd>{channel.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}
