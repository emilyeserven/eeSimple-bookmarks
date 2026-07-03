import type { GroupType } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Group Types listing Table view. */
export function useGroupTypeColumns(): ColumnDef<GroupType>[] {
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
        accessorKey: "groupCount",
        header: "Groups",
        cell: ({
          row,
        }) => (row.original.groupCount !== undefined
          ? <Badge variant="secondary">{row.original.groupCount}</Badge>
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
            to="/taxonomies/group-types/$groupTypeSlug/edit"
            params={{
              groupTypeSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "group-type", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
