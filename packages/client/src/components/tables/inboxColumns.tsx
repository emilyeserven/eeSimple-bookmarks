import type { Category, InboxItem } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link as LinkIcon } from "lucide-react";

import { ImageCell } from "./cells";
import { RowActions, StatusBadge } from "../InboxRowActions";

import { Badge } from "@/components/ui/badge";

/** Format the ISO `createdAt` timestamp as a medium-style local date for the Added column / card line. */
export function formatAdded(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString([], {
    dateStyle: "medium",
  });
}

/** Column definitions for the Inbox review-queue Table view. */
export function useInboxColumns(
  categories: Category[],
): ColumnDef<InboxItem>[] {
  return useMemo(
    () => [
      {
        id: "image",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <ImageCell
            src={row.original.imageUrl}
            fallback={<LinkIcon className="size-4" />}
          />
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        meta: {
          fill: true,
        },
        cell: ({
          row,
        }) => (
          <span className="font-medium">
            {row.original.title || row.original.anchorText || row.original.url || row.original.rawUrl}
          </span>
        ),
      },
      {
        accessorKey: "sourceLabel",
        header: "Source",
        cell: ({
          row,
        }) => <span className="text-sm text-muted-foreground">{row.original.sourceLabel ?? "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({
          row,
        }) => <StatusBadge item={row.original} />,
      },
      {
        id: "category",
        header: "Category",
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const name = row.original.categoryId
            ? categories.find(category => category.id === row.original.categoryId)?.name
            : null;
          return name ? <Badge variant="secondary">{name}</Badge> : null;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Added",
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
          <div
            className="flex justify-end"
            data-no-row-click
          >
            <RowActions item={row.original} />
          </div>
        ),
      },
    ],
    [categories],
  );
}
