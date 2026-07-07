import type { GroupType } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";
import { builtInName } from "@/lib/builtInName";

/** Column definitions for the Group Types listing Table view. */
export function useGroupTypeColumns(): ColumnDef<GroupType>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => <span className="font-medium">{builtInName(row.original, i18n.t)}</span>,
      },
      {
        accessorKey: "sortOrder",
        header: i18n.t("Sort order"),
        cell: ({
          row,
        }) => <span className="text-muted-foreground">{row.original.sortOrder}</span>,
      },
      {
        accessorKey: "groupCount",
        header: i18n.t("Groups"),
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
            label={i18n.t("Edit {{name}}", {
              name: builtInName(row.original, i18n.t),
            })}
          />
        ),
      },
    ],
    [],
  );
}
