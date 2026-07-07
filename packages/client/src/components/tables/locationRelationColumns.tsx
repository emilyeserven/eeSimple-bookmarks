import type { LocationRelation } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Lock, Waypoints } from "lucide-react";

import { EditActionCell } from "./cells";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Location Relations listing Table view. */
export function useLocationRelationColumns(): ColumnDef<LocationRelation>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <Waypoints className="size-4 shrink-0 text-muted-foreground" />
            {row.original.name}
            {row.original.builtIn
              ? <Lock className="size-3.5 shrink-0 text-muted-foreground" />
              : null}
          </div>
        ),
      },
      {
        accessorKey: "bookmarkCount",
        header: i18n.t("Bookmarks"),
        cell: ({
          row,
        }) => <Badge variant="secondary">{row.original.bookmarkCount}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: i18n.t("Created"),
        cell: ({
          row,
        }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
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
            to="/taxonomies/location-relations/$locationRelationSlug/edit"
            params={{
              locationRelationSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
          />
        ),
      },
    ],
    [],
  );
}
