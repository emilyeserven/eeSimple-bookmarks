import type { RelationshipType } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link2 } from "lucide-react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Relationship Types listing Table view. */
export function useRelationshipTypeColumns(): ColumnDef<RelationshipType>[] {
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
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            {row.original.name}
            {row.original.builtIn ? <Badge variant="outline">Built-in</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "directional",
        header: "Direction",
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.directional ? "Directional" : "Symmetric"}
          </span>
        ),
      },
      bookmarkCountColumn<RelationshipType>(),
      {
        accessorKey: "createdAt",
        header: "Created",
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
            to="/taxonomies/relationship-types/$relationshipTypeSlug/edit/general"
            params={{
              relationshipTypeSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "relationship-type", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
