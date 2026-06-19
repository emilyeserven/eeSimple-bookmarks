import { useState } from "react";

import { YouTubeChannelListItem } from "./YouTubeChannelListItem";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { Input } from "@/components/ui/input";

/** Browsable, searchable channel listing — search + list only; channels can't be added by hand. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    data: allChannels, isLoading, error,
  } = useYouTubeChannels();
  const [search, setSearch] = useState("");

  const filtered = (allChannels ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.channelKey.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or channel key…"
        value={search}
        onChange={event => setSearch(event.target.value)}
        className="max-w-sm"
      />

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
            No channels match &ldquo;{search}&rdquo;.
          </p>
        )
        : null}

      {filtered.length > 0
        ? (
          <ul className="space-y-2">
            {filtered.map(channel => (
              <li key={channel.id}>
                <YouTubeChannelListItem channel={channel} />
              </li>
            ))}
          </ul>
        )
        : null}
    </div>
  );
}
