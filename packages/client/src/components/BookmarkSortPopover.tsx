import { ArrowUpDown } from "lucide-react";

import { BookmarkSortEditor } from "./BookmarkSortFields";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { cn } from "../lib/utils";
import { useUiStore } from "../stores/uiStore";
import { Button } from "./ui/button";
import { ResponsivePopover } from "./ui/responsive-popover";

interface BookmarkSortPopoverProps {
  pageKey: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BookmarkSortPopover({
  pageKey,
  open,
  onOpenChange,
}: BookmarkSortPopoverProps) {
  const isActive = useUiStore(s => s.bookmarkSort[pageKey] != null);
  return (
    <ResponsivePopover
      title="Sort"
      open={open}
      onOpenChange={onOpenChange}
      trigger={(
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Sort bookmarks"
        >
          <span className="relative">
            <ArrowUpDown className={cn("size-4", isActive && "text-primary")} />
            {isActive && (
              <span
                className="
                  absolute -top-1 -right-1 size-1.5 rounded-full bg-primary
                "
              />
            )}
          </span>
        </Button>
      )}
    >
      <BookmarkSortControls pageKey={pageKey} />
    </ResponsivePopover>
  );
}

interface BookmarkSortControlsProps {
  pageKey: string;
}

function BookmarkSortControls({
  pageKey,
}: BookmarkSortControlsProps) {
  const sort = useUiStore(s => s.bookmarkSort[pageKey]);
  const setBookmarkSort = useUiStore(s => s.setBookmarkSort);
  const clearBookmarkSort = useUiStore(s => s.clearBookmarkSort);
  const {
    data: allProperties = [],
  } = useCustomProperties();

  return (
    <BookmarkSortEditor
      value={sort}
      onChange={(next) => {
        if (next) setBookmarkSort(pageKey, next);
        else clearBookmarkSort(pageKey);
      }}
      properties={allProperties}
      allowRandom
    />
  );
}
