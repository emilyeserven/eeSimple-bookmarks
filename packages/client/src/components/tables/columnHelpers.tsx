import type { YouTubeChannelCategory } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import i18n from "../../i18n";
import { CategoryPill } from "../CategoryPill";

import { Badge } from "@/components/ui/badge";

/**
 * Shared "Bookmarks" column rendering an entity's `bookmarkCount` as a secondary badge.
 * Used by the Categories, Media Types, and Tags listing tables.
 */
export function bookmarkCountColumn<T extends { bookmarkCount?: number }>(): ColumnDef<T> {
  return {
    accessorKey: "bookmarkCount",
    header: i18n.t("Bookmarks"),
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
    header: i18n.t("Category"),
    enableSorting: false,
    cell: ({
      row,
    }) => (row.original.category ? <CategoryPill category={row.original.category} /> : null),
  };
}
