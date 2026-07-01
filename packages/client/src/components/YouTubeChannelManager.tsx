import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { YouTubeChannelListBody } from "./YouTubeChannelListBody";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/** Browsable, searchable channel listing with add modal. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    data: allChannels, isLoading, error,
  } = useYouTubeChannels();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("youtube-channels-listing", false, false, false, () => setModalOpen(true), false, {
    addBookmark: {},
    createLabel: "New channel",
  });
  useRegisterHeaderSearch();
  const navigate = useNavigate();

  const channels = allChannels ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    channels,
    (c, query) => c.name.toLowerCase().includes(query) || c.channelKey.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={channels.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading channels…"
        entityPlural="channels"
        emptyMessage={(
          <p className="text-muted-foreground">
            No channels yet. Add one above or they&apos;re created automatically when you add YouTube bookmarks.
          </p>
        )}
      />

      <YouTubeChannelListBody filtered={filtered} />

      <AddYouTubeChannelModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(channel) => {
          void navigate({
            to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
            params: {
              channelSlug: channel.slug,
            },
          });
        }}
      />
    </div>
  );
}
