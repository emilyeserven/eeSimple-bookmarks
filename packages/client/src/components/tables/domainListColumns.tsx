import type { ColumnDef } from "@tanstack/react-table";

import { Trash2 } from "lucide-react";

import i18n from "../../i18n";

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
          aria-label={i18n.t("Remove {{name}}", {
            name: row.original,
          })}
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
  return makeStringListColumns("domain", i18n.t("Domain"), onDelete);
}
