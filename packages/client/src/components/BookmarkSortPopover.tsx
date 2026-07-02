import { ArrowUpDown } from "lucide-react";

import { BookmarkSortEditor } from "./BookmarkSortFields";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { withSort } from "../lib/bookmarkSearch";
import { cn } from "../lib/utils";
import { useUiStore } from "../stores/uiStore";
import { Button } from "./ui/button";
import { ResponsivePopover } from "./ui/responsive-popover";

interface BookmarkSortPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BookmarkSortPopover({
  open,
  onOpenChange,
}: BookmarkSortPopoverProps) {
  const isActive = useUiStore(s => s.filterContext?.search.sort != null);
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
      <BookmarkSortControls />
    </ResponsivePopover>
  );
}

function BookmarkSortControls() {
  const filterContext = useUiStore(s => s.filterContext);
  const sort = filterContext?.search.sort;
  const {
    data: allProperties = [],
  } = useCustomProperties();

  return (
    <BookmarkSortEditor
      value={sort}
      onChange={(next) => {
        if (filterContext) filterContext.onSearchChange(withSort(filterContext.search, next));
      }}
      properties={allProperties}
      allowRandom
    />
  );
}
