import type { Bookmark, CustomProperty } from "@eesimple/types";

import { BookmarkCard } from "./BookmarkCard";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { useResolveCardDisplay } from "../lib/cardDisplayRules";

import { RowCard } from "@/components/ui/card";

interface BookmarkCardGridProps {
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  columns: number;
}

/**
 * The card-grid view of a bookmark listing. Each card's display (field zones, image presentation) is
 * resolved per-bookmark from the prioritized Card Display Rules merged over the Default rule. Column
 * count stays page-level, so "side" image layout only applies at 1–2 columns.
 */
export function BookmarkCardGrid({
  bookmarks,
  properties,
  columns,
}: BookmarkCardGridProps) {
  const deleteBookmark = useDeleteBookmark();
  const resolveDisplay = useResolveCardDisplay();

  return (
    <div
      className={`
        grid gap-3
        ${COLUMN_CLASS[columns]}
      `}
    >
      {bookmarks.map((bookmark) => {
        const display = resolveDisplay(bookmark);
        return (
          <RowCard
            key={bookmark.id}
            className="p-4"
            data-bookmark-card-sample
          >
            <BookmarkCard
              bookmark={bookmark}
              properties={properties}
              onDelete={id => deleteBookmark.mutate(id)}
              fieldZones={display.fieldZones}
              cardZoneLayouts={display.cardZoneLayouts}
              imageLeft={(columns === 1 || columns === 2) && display.imageLayout === "side"}
              imageMode={display.imageMode}
              imageVisibility={display.imageVisibility}
              hideWebsiteForYouTube={display.hideWebsiteForYouTube}
            />
          </RowCard>
        );
      })}
    </div>
  );
}
