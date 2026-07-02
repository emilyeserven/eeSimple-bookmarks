import type { Publisher } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { BookOpen } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { formatAdded } from "./inboxColumns";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Publishers listing Table view. */
export function usePublisherColumns(): ColumnDef<Publisher>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({
          row,
        }) => (
          <div className="flex items-center gap-2 font-medium">
            <ImageCell
              src={null}
              shape="full"
              fallback={<BookOpen className="size-4" />}
            />
            {row.original.name}
          </div>
        ),
      },
      {
        id: "website",
        header: "Website",
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const website = row.original.website;
          if (!website) return null;
          return (
            <span className="text-muted-foreground">
              {website.siteName ? `${website.siteName} (${website.domain})` : website.domain}
            </span>
          );
        },
      },
      bookmarkCountColumn<Publisher>(),
      {
        accessorKey: "createdAt",
        header: "Created",
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
          <EditActionCell
            to="/taxonomies/publishers/$publisherSlug/edit/general"
            params={{
              publisherSlug: row.original.slug,
            }}
            label={`Edit ${row.original.name}`}
            onClick={event => editClick(event, "publisher", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
