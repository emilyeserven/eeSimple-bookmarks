import type { ColumnDef } from "@tanstack/react-table";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Column definitions for a plain string[] query-parameter list (custom strip params). */
export function paramListColumns(onDelete: (param: string) => void): ColumnDef<string>[] {
  return [
    {
      id: "param",
      accessorFn: row => row,
      header: "Parameter",
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
          aria-label={`Remove ${row.original}`}
          data-no-row-click
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];
}
