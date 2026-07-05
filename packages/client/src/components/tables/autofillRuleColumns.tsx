import type { AutofillRule, Category } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import i18n from "../../i18n";
import { summarizeConditions } from "../../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the unscoped Autofill Rules listing Table view. */
export function useAutofillRuleColumns(categories: Category[]): ColumnDef<AutofillRule>[] {
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
        id: "conditions",
        header: i18n.t("Conditions"),
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <span className="text-sm text-muted-foreground">
            {summarizeConditions(row.original.conditions)}
          </span>
        ),
      },
      {
        id: "category",
        header: i18n.t("Sets Category"),
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const name = row.original.setCategoryId
            ? categories.find(category => category.id === row.original.setCategoryId)?.name
            : null;
          return name ? <Badge variant="secondary">{name}</Badge> : null;
        },
      },
      {
        accessorKey: "matchCount",
        header: i18n.t("Bookmarks"),
        cell: ({
          row,
        }) =>
          row.original.matchCount !== undefined
            ? <Badge variant="secondary">{row.original.matchCount}</Badge>
            : null,
      },
    ],
    [categories],
  );
}
