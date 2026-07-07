import type { Language } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Languages } from "lucide-react";

import { EditActionCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";
import { languageName } from "@/lib/builtInName";

/** Column definitions for the Languages listing Table view. */
export function useLanguageColumns(): ColumnDef<Language>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <Languages className="size-4 shrink-0 text-muted-foreground" />
            {languageName(row.original, i18n.language)}
            {row.original.builtIn ? <Badge variant="outline">{i18n.t("Built-in")}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "isoCode",
        header: i18n.t("ISO code"),
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
            to="/taxonomies/languages/$languageSlug/edit/general"
            params={{
              languageSlug: row.original.slug,
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
