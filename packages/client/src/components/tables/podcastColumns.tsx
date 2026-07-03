import type { Podcast } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Podcasts listing Table view. */
export function usePodcastColumns(): ColumnDef<Podcast>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({
          row,
        }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "authors",
        header: "Authors",
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const count = row.original.personIds.length + row.original.groupIds.length;
          return (
            <span className="text-muted-foreground">
              {count > 0 ? `${count} author${count === 1 ? "" : "s"}` : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "feedUrl",
        header: "Feed",
        enableSorting: false,
        cell: ({
          row,
        }) => (row.original.feedUrl
          ? (
            <a
              href={row.original.feedUrl}
              target="_blank"
              rel="noreferrer"
              className="
                text-muted-foreground
                hover:underline
              "
              onClick={event => event.stopPropagation()}
            >
              Feed
            </a>
          )
          : <span className="text-muted-foreground">—</span>),
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
            to="/taxonomies/podcasts/$podcastSlug/edit"
            params={{
              podcastSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "podcast", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
