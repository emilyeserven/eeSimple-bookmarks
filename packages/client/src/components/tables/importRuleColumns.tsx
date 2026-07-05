import type { ImportRule, ImportRuleAction } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import i18n from "../../i18n";
import { summarizeConditions } from "../../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<ImportRuleAction, string> = {
  approve: i18n.t("Approve"),
  reject: i18n.t("Reject"),
  block: i18n.t("Block"),
};

const ACTION_VARIANTS: Record<ImportRuleAction, "default" | "secondary" | "destructive" | "outline"> = {
  approve: "default",
  reject: "secondary",
  block: "destructive",
};

/** Column definitions for the Import Rules listing table view. */
export function useImportRuleColumns(): ColumnDef<ImportRule>[] {
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
        accessorKey: "action",
        header: i18n.t("Action"),
        cell: ({
          row,
        }) => (
          <Badge variant={ACTION_VARIANTS[row.original.action]}>
            {ACTION_LABELS[row.original.action]}
          </Badge>
        ),
      },
      {
        accessorKey: "sortOrder",
        header: i18n.t("Priority"),
      },
    ],
    [],
  );
}
