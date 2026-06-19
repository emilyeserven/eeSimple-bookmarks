import { LayoutGrid } from "lucide-react";

import { DisplaySettingsControls } from "./DisplaySettingsControls";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LayoutOptionsPopoverProps {
  pageKey: string;
  showsImages: boolean;
}

export function LayoutOptionsPopover({
  pageKey, showsImages,
}: LayoutOptionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Layout options"
        >
          <LayoutGrid className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56"
      >
        <p className="mb-2 text-sm font-medium">Layout options</p>
        <DisplaySettingsControls
          pageKey={pageKey}
          showsImages={showsImages}
        />
      </PopoverContent>
    </Popover>
  );
}
