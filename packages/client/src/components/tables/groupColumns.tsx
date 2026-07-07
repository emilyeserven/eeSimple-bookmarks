import type { Group } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { BookOpen } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { formatAdded } from "./inboxColumns";
import i18n from "../../i18n";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Groups listing Table view. */
export function useGroupColumns(): ColumnDef<Group>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <ImageCell
              src={null}
              shape="full"
              fallback={<BookOpen className="size-4" />}
            />
            {row.original.name}
          </div>
        ),
      },
      {
        id: "website",
        header: i18n.t("Website"),
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const site = row.original.labeledWebsites[0];
          if (!site) return null;
          return (
            <span className="text-muted-foreground">
              {site.label.trim().length > 0 ? `${site.label} (${site.url})` : site.url}
            </span>
          );
        },
      },
      bookmarkCountColumn<Group>(),
      {
        accessorKey: "createdAt",
        header: i18n.t("Created"),
        cell: ({
          row,
        }) => (
          <span className="text-sm text-muted-foreground">{formatAdded(row.original.createdAt)}</span>
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
            to="/taxonomies/groups/$groupSlug/edit/general"
            params={{
              groupSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
            onClick={event => editClick(event, "group", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
