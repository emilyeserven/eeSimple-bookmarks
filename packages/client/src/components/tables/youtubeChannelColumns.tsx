import type { YouTubeChannel } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { MonitorPlay } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { CategoryPill } from "../CategoryPill";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

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
      {
        id: "category",
        header: "Category",
        enableSorting: false,
        cell: ({
          row,
        }) => (row.original.category ? <CategoryPill category={row.original.category} /> : null),
      },
      {
        accessorKey: "bookmarkCount",
        header: "Bookmarks",
        cell: ({
          row,
        }) => (row.original.bookmarkCount !== undefined
          ? <Badge variant="secondary">{row.original.bookmarkCount}</Badge>
          : null),
      },
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
