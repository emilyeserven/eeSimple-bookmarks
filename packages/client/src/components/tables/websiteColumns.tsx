import type { Website } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Globe } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn, categoryPillColumn } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Websites listing Table view. */
export function useWebsiteColumns(): ColumnDef<Website>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "siteName",
        header: "Name",
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
        header: "Domain",
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
            label={`Edit ${row.original.siteName}`}
            onClick={event => editClick(event, "website", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
