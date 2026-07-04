import type { DrawerContentType } from "@/lib/drawerSearch";
import type { YouTubeChannelCategory } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";
import type { MouseEvent } from "react";

import { CategoryPill } from "../CategoryPill";
import { EditActionCell } from "./cells";

import { Badge } from "@/components/ui/badge";

/**
 * Shared "Bookmarks" column rendering an entity's `bookmarkCount` as a secondary badge.
 * Used by the Categories, Media Types, and Tags listing tables.
 */
export function bookmarkCountColumn<T extends { bookmarkCount?: number }>(): ColumnDef<T> {
  return {
    accessorKey: "bookmarkCount",
    header: "Bookmarks",
    cell: ({
      row,
    }) => (row.original.bookmarkCount !== undefined
      ? <Badge variant="secondary">{row.original.bookmarkCount}</Badge>
      : null),
  };
}

/**
 * Shared "Category" column rendering a {@link CategoryPill} when the entity has a category.
 * Used by the Websites and YouTube Channels listing tables.
 */
export function categoryPillColumn<T extends { category?: YouTubeChannelCategory | null }>(): ColumnDef<T> {
  return {
    id: "category",
    header: "Category",
    enableSorting: false,
    cell: ({
      row,
    }) => (row.original.category ? <CategoryPill category={row.original.category} /> : null),
  };
}

/** Row shape shared by the five Plex-backed media taxonomies (Albums, Episodes, Movies, Tracks, TV Shows). */
interface PlexMediaRow {
  id: string;
  slug: string;
  name: string;
  year?: number | null;
  plexRatingKey?: string | null;
  bookmarkCount?: number;
}

/**
 * Shared column set (Name / Year / Plex-linked / Bookmarks / edit action) for the five Plex-backed
 * media taxonomy listing tables, which differ only in their edit route, slug param key, and the
 * panel content-type string passed to the edit-panel click handler.
 */
export function plexMediaColumns<T extends PlexMediaRow>({
  editTo, paramKey, panelKind, editClick,
}: { editTo: string;
  paramKey: string;
  panelKind: DrawerContentType;
  editClick: (event: MouseEvent, ct: DrawerContentType, id: string) => void; }): ColumnDef<T>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({
        row,
      }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({
        row,
      }) => <span className="text-muted-foreground">{row.original.year ?? "—"}</span>,
    },
    {
      accessorKey: "plexRatingKey",
      header: "Plex",
      enableSorting: false,
      cell: ({
        row,
      }) => (
        <span className="text-muted-foreground">
          {row.original.plexRatingKey ? "Linked" : "—"}
        </span>
      ),
    },
    bookmarkCountColumn<T>(),
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({
        row,
      }) => (
        <EditActionCell
          to={editTo}
          params={{
            [paramKey]: row.original.slug,
          }}
          label={`Edit ${row.original.name}`}
          onClick={event => editClick(event, panelKind, row.original.id)}
        />
      ),
    },
  ];
}
