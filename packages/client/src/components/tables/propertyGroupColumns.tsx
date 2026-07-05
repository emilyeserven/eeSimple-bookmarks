import type { PropertyGroup } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import i18n from "../../i18n";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Property Groups listing Table view. */
export function usePropertyGroupColumns(): ColumnDef<PropertyGroup>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "description",
        header: i18n.t("Description"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.description || i18n.t("Priority {{priority}}", {
              priority: row.original.priority,
            })}
          </span>
        ),
      },
      {
        accessorKey: "propertyCount",
        header: i18n.t("Properties"),
        cell: ({
          row,
        }) => (row.original.propertyCount !== undefined
          ? <Badge variant="secondary">{row.original.propertyCount}</Badge>
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
            to="/taxonomies/property-groups/$propertyGroupSlug/edit"
            params={{
              propertyGroupSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
            onClick={event => editClick(event, "property-group", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
