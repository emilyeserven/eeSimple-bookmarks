import type { Bookmark, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { BookmarkCard } from "./BookmarkCard";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { useResolveCardDisplay } from "../lib/cardDisplayRules";

import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

interface BookmarkCardGridProps {
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  columns: number;
  /** When true, clicking a card selects it (instead of navigating) via an overlay. */
  selectionMode?: boolean;
  isSelected?: (id: string) => boolean;
  onToggleSelect?: (id: string) => void;
  /** Optional badge rendered top-left of a card (e.g. a pinned relationship badge); null/undefined = no badge. */
  badgeFor?: (bookmark: Bookmark) => ReactNode;
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
  badgeFor,
}: BookmarkCardGridProps) {
  const {
    t,
  } = useTranslation();
  const deleteBookmark = useDeleteBookmark();
  const setHoveredBookmarkId = useUiStore(state => state.setHoveredBookmarkId);
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
        const badge = badgeFor?.(bookmark);
        return (
          <div
            key={bookmark.id}
            className="group relative h-full"
            onMouseEnter={() => setHoveredBookmarkId(bookmark.id)}
            onMouseLeave={() => setHoveredBookmarkId(null)}
          >
            {badge
              ? (
                <div
                  className="
                    absolute top-2 left-2 z-20 flex flex-wrap items-center gap-1
                    rounded-sm border bg-background/90 px-1.5 py-0.5 shadow-sm
                  "
                >
                  {badge}
                </div>
              )
              : null}
            <RowCard
              className={cn("flex h-full flex-col p-4", selected && `
                ring-2 ring-primary
              `)}
              data-bookmark-card-sample
            >
              <BookmarkCard
                bookmark={bookmark}
                properties={properties}
                onDelete={id => deleteBookmark.mutate(id)}
                sections={display.sections}
                imageCorners={display.imageCorners}
                imageLeft={(columns === 1 || columns === 2) && display.imageLayout === "side"}
                imageMode={display.imageMode}
                imageVisibility={display.imageVisibility}
                hideWebsiteForYouTube={display.hideWebsiteForYouTube}
                loading={displayPending}
              />
            </RowCard>
            {/* Hover hint: this card is the ⌘K quick-edit target. Pointer-events-none so it never blocks clicks. */}
            {selectionMode
              ? null
              : (
                <span
                  className="
                    pointer-events-none absolute right-2 bottom-2 z-20
                    rounded-sm border bg-background/90 px-1.5 py-0.5 text-xs
                    text-muted-foreground opacity-0 shadow-sm transition-opacity
                    group-hover:opacity-100
                  "
                >
                  {t("⌘K to edit")}
                </span>
              )}
            {/* In selection mode an overlay swallows card clicks so the whole card toggles. */}
            {selectionMode
              ? (
                <>
                  <button
                    type="button"
                    aria-label={t("Select {{title}}", {
                      title: bookmark.title,
                    })}
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
