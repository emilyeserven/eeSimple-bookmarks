import type { Person } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { UserRound } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { formatAdded } from "./inboxColumns";
import i18n from "../../i18n";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the People listing Table view. */
export function usePersonColumns(): ColumnDef<Person>[] {
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
              src={row.original.imageUrl}
              shape="full"
              fallback={<UserRound className="size-4" />}
            />
            {row.original.name}
          </div>
        ),
      },
      bookmarkCountColumn<Person>(),
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
            to="/taxonomies/people/$personSlug/edit/general"
            params={{
              personSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
            onClick={event => editClick(event, "person", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
