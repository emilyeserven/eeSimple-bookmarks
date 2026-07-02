import type { Author } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { UserRound } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { formatAdded } from "./inboxColumns";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Authors listing Table view. */
export function useAuthorColumns(): ColumnDef<Author>[] {
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
              fallback={<UserRound className="size-4" />}
            />
            {row.original.name}
          </div>
        ),
      },
      bookmarkCountColumn<Author>(),
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({
          row,
        }) => (
          <span className="text-sm text-muted-foreground">{formatAdded(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/taxonomies/authors/$authorSlug/edit/general"
            params={{
              authorSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "author", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
