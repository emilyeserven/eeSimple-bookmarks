import type { Bookmark, BookmarkImageVisibility, CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useBookmarkTableColumns } from "./tables/bookmarkColumns";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

interface HomepageSectionTableProps {
  bookmarks: Bookmark[];
  customProperties: CustomProperty[];
  hiddenFields: Set<string>;
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  hideWebsiteForYouTube: boolean;
}

export function HomepageSectionTable({
  bookmarks, customProperties, hiddenFields, imageMode, imageVisibility, hideWebsiteForYouTube,
}: HomepageSectionTableProps) {
  const navigate = useNavigate();
  const rowNav = useTableRowNav();
  const tableColumns = useBookmarkTableColumns({
    properties: customProperties,
    hidden: hiddenFields,
    imageMode,
    imageVisibility,
    hideWebsiteForYouTube,
  });

  return (
    <DataTable
      columns={tableColumns}
      data={bookmarks}
      sortable
      onRowClick={(bookmark, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/bookmarks/$bookmarkId",
            params: {
              bookmarkId: bookmark.id,
            },
          });
        }, () => {
          void navigate({
            to: "/bookmarks/$bookmarkId/edit",
            params: {
              bookmarkId: bookmark.id,
            },
            search: {},
          });
        })}
    />
  );
}
