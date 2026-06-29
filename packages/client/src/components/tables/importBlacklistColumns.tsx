import type { ImportBlacklistEntry, ImportBlacklistKind } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const KIND_LABEL: Record<ImportBlacklistKind, string> = {
  "exact": "url",
  "domain": "domain",
  "path-prefix": "path",
};

/** Column definitions for the import blacklist table. */
export function importBlacklistColumns(
  onDelete: (entry: ImportBlacklistEntry) => void,
): ColumnDef<ImportBlacklistEntry>[] {
  return [
    {
      id: "kind",
      header: "Type",
      size: 80,
      cell: ({
        row,
      }) => (
        <Badge variant="secondary">{KIND_LABEL[row.original.kind]}</Badge>
      ),
    },
    {
      id: "value",
      accessorKey: "value",
      header: "Pattern",
      meta: {
        fill: true,
      },
    },
    {
      id: "actions",
      header: "",
      size: 48,
      cell: ({
        row,
      }) => (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Remove ${row.original.value}`}
          data-no-row-click
          className="
            opacity-0 transition-opacity
            group-hover/row:opacity-100
            focus-visible:opacity-100
          "
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];
}
