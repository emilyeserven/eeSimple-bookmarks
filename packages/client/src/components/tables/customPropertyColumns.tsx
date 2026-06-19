import type { CustomProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { TYPE_LABELS } from "../../lib/propertyFormat";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Custom Properties listing Table view. */
export function useCustomPropertyColumns(): ColumnDef<CustomProperty>[] {
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
            {row.original.name}
            {row.original.builtIn ? <Badge variant="outline">Built-in</Badge> : null}
            {!row.original.enabled ? <Badge variant="outline">Disabled</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({
          row,
        }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
      },
      {
        id: "categories",
        header: "Categories",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.allCategories
              ? "All"
              : row.original.categoryIds.length === 0
                ? "None"
                : `${row.original.categoryIds.length}`}
          </span>
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
            to="/custom-properties/$propertySlug/edit/general"
            params={{
              propertySlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "property", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
