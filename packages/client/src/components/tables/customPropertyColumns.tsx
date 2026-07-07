import type { CustomProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { useDisplayPreferenceSettings } from "../../hooks/useAppSettings";
import i18n from "../../i18n";
import { TYPE_LABELS, resolvePropertyTypeIcon } from "../../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** Column definitions for the Custom Properties listing Table view. */
export function useCustomPropertyColumns(): ColumnDef<CustomProperty>[] {
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const typeIcons = displayPrefs?.customPropertyTypeIcons ?? null;
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <CategoryIcon
              name={resolvePropertyTypeIcon(row.original.type, typeIcons)}
              className="size-4 shrink-0 text-muted-foreground"
            />
            {row.original.name}
            {row.original.builtIn ? <Badge variant="outline">{i18n.t("Built-in")}</Badge> : null}
            {!row.original.enabled ? <Badge variant="outline">{i18n.t("Disabled")}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: i18n.t("Type"),
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
        header: i18n.t("Categories"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.allCategories || row.original.categoryIds.length === 0
              ? i18n.t("All")
              : `${row.original.categoryIds.length}`}
          </span>
        ),
      },
      {
        id: "media-types",
        header: i18n.t("Media Types"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.allMediaTypes || row.original.mediaTypeIds.length === 0
              ? i18n.t("All")
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
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
          />
        ),
      },
    ],
    [typeIcons],
  );
}
