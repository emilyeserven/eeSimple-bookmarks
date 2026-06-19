import { SlidersHorizontal } from "lucide-react";

import { DisplaySettingsControls } from "./DisplaySettingsControls";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ListingOptionsPopoverProps {
  pageKey: string;
  showsImages: boolean;
}

export function ListingOptionsPopover({
  pageKey, showsImages,
}: ListingOptionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Listing options"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56"
      >
        <DisplaySettingsControls
          pageKey={pageKey}
          showsImages={showsImages}
        />
      </PopoverContent>
    </Popover>
  );
}
