import type { Website } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Globe } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn, categoryPillColumn } from "./columnHelpers";
import i18n from "../../i18n";

/** Column definitions for the Websites listing Table view. */
export function useWebsiteColumns(): ColumnDef<Website>[] {
  return useMemo(
    () => [
      {
        accessorKey: "siteName",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <ImageCell
              src={row.original.imageUrl}
              fallback={<Globe className="size-4" />}
            />
            {row.original.siteName}
          </div>
        ),
      },
      {
        accessorKey: "domain",
        header: i18n.t("Domain"),
        cell: ({
          row,
        }) => <span className="text-muted-foreground">{row.original.domain}</span>,
      },
      categoryPillColumn<Website>(),
      bookmarkCountColumn<Website>(),
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/taxonomies/websites/$websiteSlug/edit"
            params={{
              websiteSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.siteName,
            })}
          />
        ),
      },
    ],
    [],
  );
}
