import type { YouTubeChannel } from "@eesimple/types";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { YouTubeChannelListItem } from "./YouTubeChannelListItem";
import { YouTubeChannelTable } from "./YouTubeChannelTable";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useBulkDeleteYouTubeChannels } from "../hooks/useYouTubeChannels";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** Bulk-action bar + table/card-grid body for the YouTube channels listing, owning the selection. */
export function YouTubeChannelListBody({
  filtered,
}: {
  filtered: YouTubeChannel[];
}) {
  const columns = useBookmarkColumns("youtube-channels-listing");
  const viewMode = useViewMode("youtube-channels-listing");

  const deletableIds = filtered.map(c => c.id);
  const selection = useListSelection("youtube-channels-listing", deletableIds);
  useRegisterBulkSelect("youtube-channels-listing");
  const bulkDelete = useBulkDeleteYouTubeChannels();

  return (
    <>
      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["channel", "channels"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <YouTubeChannelTable
            channels={filtered}
            selection={selection}
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
    </>
  );
}
