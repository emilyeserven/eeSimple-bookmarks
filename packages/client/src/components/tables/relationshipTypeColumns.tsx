import type { RelationshipType } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link2 } from "lucide-react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";
import { builtInName } from "@/lib/builtInName";

/** Column definitions for the Relationship Types listing Table view. */
export function useRelationshipTypeColumns(): ColumnDef<RelationshipType>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            {builtInName(row.original, i18n.t)}
            {row.original.builtIn ? <Badge variant="outline">{i18n.t("Built-in")}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "directional",
        header: i18n.t("Direction"),
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.directional ? i18n.t("Directional") : i18n.t("Symmetric")}
          </span>
        ),
      },
      bookmarkCountColumn<RelationshipType>(),
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
            to="/taxonomies/relationship-types/$relationshipTypeSlug/edit"
            params={{
              relationshipTypeSlug: row.original.slug,
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
