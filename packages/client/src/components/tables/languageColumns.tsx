import type { Language } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Languages } from "lucide-react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Languages listing Table view. */
export function useLanguageColumns(): ColumnDef<Language>[] {
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
            <Languages className="size-4 shrink-0 text-muted-foreground" />
            {row.original.name}
            {row.original.builtIn ? <Badge variant="outline">Built-in</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "isoCode",
        header: "ISO code",
        cell: ({
          row,
        }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.isoCode ?? "—"}
          </span>
        ),
      },
      bookmarkCountColumn<Language>(),
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
            to="/taxonomies/languages/$languageSlug/edit/general"
            params={{
              languageSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "language", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
