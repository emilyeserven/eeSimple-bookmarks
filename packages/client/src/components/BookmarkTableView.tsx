import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useBookmarkTableColumns } from "./tables/bookmarkColumns";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";
import { useUiStore } from "@/stores/uiStore";

/**
 * Stable empty default for a page with no saved column widths. Returning a fresh `{}` from the
 * zustand selector would make `useSyncExternalStore` see a new snapshot every render and loop
 * ("Maximum update depth exceeded"), so the fallback must be a shared constant.
 */
const EMPTY_COLUMN_SIZING: Record<string, number> = {};

interface BookmarkTableViewProps {
  /** Stable listing-page key, used for persisted table column widths. */
  pageKey: string;
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  /** Locked category for the add form / column context, when listing within a category. */
  categoryId?: string;
}

/** The data-table view of a bookmark listing, with resizable, per-page persisted column widths. */
export function BookmarkTableView({
  pageKey,
  bookmarks,
  properties,
  categoryId,
}: BookmarkTableViewProps) {
  const tableColumnWidths = useUiStore(state => state.tableColumnWidths[pageKey]) ?? EMPTY_COLUMN_SIZING;
  const setTableColumnWidths = useUiStore(state => state.setTableColumnWidths);
  const tableColumns = useBookmarkTableColumns({
    properties,
    pageKey,
    categoryId,
  });
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      resizable
      columnSizing={tableColumnWidths}
      onColumnSizingChange={widths => setTableColumnWidths(pageKey, widths)}
      columns={tableColumns}
      data={bookmarks}
      sortable
      onRowClick={(bookmark, event) =>
        rowNav(event, "bookmark", bookmark.id, () => {
          void navigate({
            to: "/bookmarks/$bookmarkId",
            params: {
              bookmarkId: bookmark.id,
            },
          });
        })}
    />
  );
}
