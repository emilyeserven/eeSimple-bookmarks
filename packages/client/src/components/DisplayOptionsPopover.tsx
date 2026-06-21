import { Eye } from "lucide-react";

import { ListingDisplayControls } from "./ListingDisplayControls";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DisplayOptionsPopoverProps {
  pageKey: string;
}

/**
 * The display-options popover for listing pages: the card/table view toggle and grid column count.
 * Per-card field visibility and image presentation are configured in Settings → Card Display Rules,
 * not here.
 */
export function DisplayOptionsPopover({
  pageKey,
}: DisplayOptionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Display options"
        >
          <Eye className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto min-w-56"
      >
        <p className="mb-3 text-sm font-medium">Layout</p>
        <ListingDisplayControls pageKey={pageKey} />
      </PopoverContent>
    </Popover>
  );
}
