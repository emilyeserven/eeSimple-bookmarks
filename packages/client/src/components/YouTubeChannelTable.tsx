import type { ListSelection } from "../lib/useListSelection";
import type { YouTubeChannel } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useYouTubeChannelColumns } from "./tables/youtubeChannelColumns";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the YouTube channels listing, with an optional selection column in bulk-select mode. */
export function YouTubeChannelTable({
  channels,
  selection,
}: {
  channels: YouTubeChannel[];
  selection: ListSelection;
}) {
  const channelColumns = useYouTubeChannelColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<YouTubeChannel>(selection, c => c.id)] : []),
        ...channelColumns,
      ]}
      data={channels}
      sortable
      onRowClick={(channel, event) =>
        rowNav(event, () => {
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
  );
}
