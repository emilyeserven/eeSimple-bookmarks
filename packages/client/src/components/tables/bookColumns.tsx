import type { Book } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import i18n from "../../i18n";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Books listing Table view. */
export function useBookColumns(): ColumnDef<Book>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "kavitaSeriesName",
        header: i18n.t("Kavita series"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">
            {row.original.kavitaSeriesName ?? i18n.t("—")}
          </span>
        ),
      },
      {
        accessorKey: "releaseYear",
        header: i18n.t("Year"),
        cell: ({
          row,
        }) => <span className="text-muted-foreground">{row.original.releaseYear ?? i18n.t("—")}</span>,
      },
      {
        accessorKey: "bookmarkCount",
        header: i18n.t("Bookmarks"),
        cell: ({
          row,
        }) => (row.original.bookmarkCount !== undefined
          ? <Badge variant="secondary">{row.original.bookmarkCount}</Badge>
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
            to="/taxonomies/books/$bookSlug/edit"
            params={{
              bookSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
            onClick={event => editClick(event, "book", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
