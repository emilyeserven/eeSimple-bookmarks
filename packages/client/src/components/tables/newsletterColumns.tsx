import type { Newsletter } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Mail } from "lucide-react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn, categoryPillColumn } from "./columnHelpers";
import i18n from "../../i18n";

/** Column definitions for the Newsletters listing Table view. */
export function useNewsletterColumns(): ColumnDef<Newsletter>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
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
            to="/taxonomies/newsletters/$newsletterSlug/edit"
            params={{
              newsletterSlug: row.original.slug,
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
