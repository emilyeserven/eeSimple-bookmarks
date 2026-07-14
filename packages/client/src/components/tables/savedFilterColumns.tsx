import type { SavedFilter } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Globe, ListFilter } from "lucide-react";

import { EditActionCell } from "./cells";
import i18n from "../../i18n";
import { summarizeBookmarkSearch } from "../../lib/bookmarkSearch";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Saved Filters listing Table view. */
export function useSavedFilterColumns(): ColumnDef<SavedFilter>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <ListFilter className="size-4 shrink-0 text-muted-foreground" />
            {row.original.name}
          </div>
        ),
      },
      {
        id: "filters",
        header: i18n.t("Filters"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-sm text-muted-foreground">
            {summarizeBookmarkSearch(row.original.filters)}
          </span>
        ),
      },
      {
        accessorKey: "viewableOnline",
        header: i18n.t("Sidebar Shortcut"),
        cell: ({
          row,
        }) => (row.original.viewableOnline
          ? (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <Globe className="size-3.5" />
              {i18n.t("Viewable online")}
            </Badge>
          )
          : null),
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
        }) => (row.original.slug
          ? (
            <EditActionCell
              to="/saved-filters/$filterSlug/edit"
              params={{
                filterSlug: row.original.slug,
              }}
              label={i18n.t("Edit {{name}}", {
                name: row.original.name,
              })}
            />
          )
          : null),
      },
    ],
    [],
  );
}
