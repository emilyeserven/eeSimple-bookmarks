import type { Category } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** Column definitions for the Categories listing Table view. */
export function useCategoryColumns(): ColumnDef<Category>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <CategoryIcon
              name={row.original.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            {row.original.name}
            {row.original.builtIn ? <Badge variant="outline">{i18n.t("Built-in")}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: i18n.t("Description"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-muted-foreground">{row.original.description ?? i18n.t("—")}</span>
        ),
      },
      bookmarkCountColumn<Category>(),
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/categories/$categorySlug/edit/general"
            params={{
              categorySlug: row.original.slug,
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
