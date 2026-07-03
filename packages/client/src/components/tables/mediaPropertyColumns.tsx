import type { MediaProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Media Properties listing Table view. */
export function useMediaPropertyColumns(): ColumnDef<MediaProperty>[] {
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
        accessorKey: "sortOrder",
        header: "Sort order",
        cell: ({
          row,
        }) => <span className="text-muted-foreground">{row.original.sortOrder}</span>,
      },
      {
        accessorKey: "bookCount",
        header: "Books",
        cell: ({
          row,
        }) => (row.original.bookCount !== undefined
          ? <Badge variant="secondary">{row.original.bookCount}</Badge>
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
            to="/taxonomies/media-properties/$mediaPropertySlug/edit"
            params={{
              mediaPropertySlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "media-property", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
