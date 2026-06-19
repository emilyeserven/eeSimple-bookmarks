import type { YouTubeChannel } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { MonitorPlay } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn, categoryPillColumn } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the YouTube Channels listing Table view. */
export function useYouTubeChannelColumns(): ColumnDef<YouTubeChannel>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <ImageCell
              src={row.original.imageUrl}
              shape="full"
              fallback={<MonitorPlay className="size-4" />}
            />
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "channelKey",
        header: "Channel Key",
        cell: ({
          row,
        }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.channelKey}</span>
        ),
      },
      categoryPillColumn<YouTubeChannel>(),
      bookmarkCountColumn<YouTubeChannel>(),
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/taxonomies/youtube-channels/$channelSlug/edit"
            params={{
              channelSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "youtube-channel", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
