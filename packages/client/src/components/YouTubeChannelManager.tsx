import { YouTubeChannelListItem } from "./YouTubeChannelListItem";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

import { useUiStore } from "@/stores/uiStore";

/** Browsable, searchable channel listing — search + list only; channels can't be added by hand. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    data: allChannels, isLoading, error,
  } = useYouTubeChannels();
  useSetListingPage("youtube-channels-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("youtube-channels-listing");

  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const q = rawQuery.trim().toLowerCase();
  const filtered = (allChannels ?? []).filter((c) => {
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.channelKey.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {q && filtered.length < (allChannels?.length ?? 0)
        ? (
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {allChannels?.length ?? 0}
          </p>
        )
        : null}

      {isLoading ? <p className="text-muted-foreground">Loading channels…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (allChannels?.length ?? 0) === 0
        ? (
          <p className="text-muted-foreground">
            No channels yet. They&apos;re created automatically when you add YouTube bookmarks.
          </p>
        )
        : null}
      {!isLoading && (allChannels?.length ?? 0) > 0 && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            No channels match &ldquo;{rawQuery}&rdquo;.
          </p>
        )
        : null}

      {filtered.length > 0
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(channel => (
              <YouTubeChannelListItem
                key={channel.id}
                channel={channel}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
