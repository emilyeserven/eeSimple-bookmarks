import { Columns2 } from "lucide-react";

import { BookmarkDetailLayoutControls } from "./BookmarkDetailLayoutControls";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

/**
 * Header control for the bookmark detail page: switches its body between a single stacked column and
 * a vertical-tabbed layout. A popover on desktop, a modal on small screens — both render the shared
 * {@link BookmarkDetailLayoutControls}.
 */
export function BookmarkDetailLayoutPopover({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  return (
    <ResponsivePopover
      title="Layout"
      open={open}
      onOpenChange={onOpenChange}
      trigger={(
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Layout"
        >
          <Columns2 className="size-4" />
        </Button>
      )}
    >
      <BookmarkDetailLayoutControls />
    </ResponsivePopover>
  );
}
