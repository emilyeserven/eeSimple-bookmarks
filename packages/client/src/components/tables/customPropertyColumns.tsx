import type { CustomProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { useDisplayPreferenceSettings } from "../../hooks/useAppSettings";
import { TYPE_LABELS, resolvePropertyTypeIcon } from "../../lib/propertyFormat";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** Column definitions for the Custom Properties listing Table view. */
export function useCustomPropertyColumns(): ColumnDef<CustomProperty>[] {
  const editClick = useEditPanelClick();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const typeIcons = displayPrefs?.customPropertyTypeIcons ?? null;
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
              name={resolvePropertyTypeIcon(row.original.type, typeIcons)}
              className="size-4 shrink-0 text-muted-foreground"
            />
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
        }) => (
          <Badge
            variant="secondary"
            className="gap-1.5"
          >
            <CategoryIcon
              name={resolvePropertyTypeIcon(row.original.type, typeIcons)}
              className="size-3.5 shrink-0"
            />
            {TYPE_LABELS[row.original.type]}
          </Badge>
        ),
      },
      {
        id: "categories",
        header: "Categories",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.allCategories || row.original.categoryIds.length === 0
              ? "All"
              : `${row.original.categoryIds.length}`}
          </span>
        ),
      },
      {
        id: "media-types",
        header: "Media Types",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.allMediaTypes || row.original.mediaTypeIds.length === 0
              ? "All"
              : `${row.original.mediaTypeIds.length}`}
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
    [editClick, typeIcons],
  );
}
