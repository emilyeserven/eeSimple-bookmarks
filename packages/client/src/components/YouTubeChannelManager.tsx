import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useYouTubeChannelColumns } from "./tables/youtubeChannelColumns";
import { YouTubeChannelListItem } from "./YouTubeChannelListItem";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useBulkDeleteYouTubeChannels, useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

import { DataTable } from "@/components/ui/data-table";

/** Browsable, searchable channel listing with add modal. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    data: allChannels, isLoading, error,
  } = useYouTubeChannels();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("youtube-channels-listing", false, false, false, () => setModalOpen(true));
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("youtube-channels-listing");
  const viewMode = useViewMode("youtube-channels-listing");
  const channelColumns = useYouTubeChannelColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  const channels = allChannels ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    channels,
    (c, query) => c.name.toLowerCase().includes(query) || c.channelKey.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(c => c.id);
  const selection = useListSelection("youtube-channels-listing", deletableIds);
  useRegisterBulkSelect("youtube-channels-listing");
  const bulkDelete = useBulkDeleteYouTubeChannels();

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

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["channel", "channels"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode ? [listingSelectionColumn<YouTubeChannel>(selection, c => c.id)] : []),
              ...channelColumns,
            ]}
            data={filtered}
            sortable
            onRowClick={(channel, event) =>
              rowNav(event, "youtube-channel", channel.id, () => {
                void navigate({
                  to: "/taxonomies/youtube-channels/$channelSlug",
                  params: {
                    channelSlug: channel.slug,
                  },
                });
              }, () => {
                void navigate({
                  to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
                  params: {
                    channelSlug: channel.slug,
                  },
                });
              })}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
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
                selectable
                selected={selection.isSelected(channel.id)}
                onSelectToggle={() => selection.toggle(channel.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}

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
