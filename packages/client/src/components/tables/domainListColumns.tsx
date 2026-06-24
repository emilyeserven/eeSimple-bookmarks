import type { ColumnDef } from "@tanstack/react-table";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function makeStringListColumns(id: string, header: string, onDelete: (item: string) => void): ColumnDef<string>[] {
  return [
    {
      id,
      accessorFn: row => row,
      header,
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

/** Column definitions for a plain string[] domain list (shortener ignore + redirect ignore). */
export function domainListColumns(onDelete: (domain: string) => void): ColumnDef<string>[] {
  return makeStringListColumns("domain", "Domain", onDelete);
}
