import type { Newsletter } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Mail } from "lucide-react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn, categoryPillColumn } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Newsletters listing Table view. */
export function useNewsletterColumns(): ColumnDef<Newsletter>[] {
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
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            {row.original.name}
          </div>
        ),
      },
      categoryPillColumn<Newsletter>(),
      bookmarkCountColumn<Newsletter>(),
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
            to="/taxonomies/newsletters/$newsletterSlug/edit/general"
            params={{
              newsletterSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "newsletter", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
