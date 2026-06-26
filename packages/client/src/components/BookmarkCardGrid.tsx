import type { Bookmark, CustomProperty } from "@eesimple/types";

import { BookmarkCard } from "./BookmarkCard";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { useResolveCardDisplay } from "../lib/cardDisplayRules";

import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface BookmarkCardGridProps {
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  columns: number;
  /** When true, clicking a card selects it (instead of navigating) via an overlay. */
  selectionMode?: boolean;
  isSelected?: (id: string) => boolean;
  onToggleSelect?: (id: string) => void;
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
  selectionMode = false,
  isSelected,
  onToggleSelect,
}: BookmarkCardGridProps) {
  const deleteBookmark = useDeleteBookmark();
  const {
    resolve: resolveDisplay, isPending: displayPending,
  } = useResolveCardDisplay();

  return (
    <div
      className={`
        grid gap-3
        ${COLUMN_CLASS[columns]}
      `}
    >
      {bookmarks.map((bookmark) => {
        const display = resolveDisplay(bookmark);
        const selected = isSelected?.(bookmark.id) ?? false;
        return (
          <div
            key={bookmark.id}
            className="relative"
          >
            <RowCard
              className={cn("p-4", selected && "ring-2 ring-primary")}
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
                imageVisibility={displayPending ? "off" : display.imageVisibility}
                hideWebsiteForYouTube={display.hideWebsiteForYouTube}
              />
            </RowCard>
            {/* In selection mode an overlay swallows card clicks so the whole card toggles. */}
            {selectionMode
              ? (
                <>
                  <button
                    type="button"
                    aria-label={`Select ${bookmark.title}`}
                    aria-pressed={selected}
                    className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                    onClick={() => onToggleSelect?.(bookmark.id)}
                  />
                  <div className="absolute top-3 left-3 z-20">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelect?.(bookmark.id)}
                    />
                  </div>
                </>
              )
              : null}
          </div>
        );
      })}
    </div>
  );
}
