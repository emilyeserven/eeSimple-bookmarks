import type { ImportRule, ImportRuleAction } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { summarizeConditions } from "../../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<ImportRuleAction, string> = {
  approve: "Approve",
  reject: "Reject",
  block: "Block",
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
        header: "Name",
        cell: ({
          row,
        }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "conditions",
        header: "Conditions",
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
        header: "Action",
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
        header: "Priority",
      },
    ],
    [],
  );
}
