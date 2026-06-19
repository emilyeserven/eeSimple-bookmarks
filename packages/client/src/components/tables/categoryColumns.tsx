import type { Category } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** Column definitions for the Categories listing Table view. */
export function useCategoryColumns(): ColumnDef<Category>[] {
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
            <CategoryIcon
              name={row.original.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            {row.original.name}
            {row.original.builtIn ? <Badge variant="outline">Built-in</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">{row.original.description ?? "—"}</span>
        ),
      },
      bookmarkCountColumn<Category>(),
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/categories/$categorySlug/edit/general"
            params={{
              categorySlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "category", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
