import type { TvShow } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the TV Shows listing Table view. */
export function useTvShowColumns(): ColumnDef<TvShow>[] {
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
        accessorKey: "year",
        header: "Year",
        cell: ({
          row,
        }) => <span className="text-muted-foreground">{row.original.year ?? "—"}</span>,
      },
      {
        accessorKey: "plexRatingKey",
        header: "Plex",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.plexRatingKey ? "Linked" : "—"}
          </span>
        ),
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
            to="/taxonomies/tv-shows/$tvShowSlug/edit"
            params={{
              tvShowSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "tv-show", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
