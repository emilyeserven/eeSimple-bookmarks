import { Eye } from "lucide-react";

import { CardDisplayControls } from "./CardDisplayControls";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CardOptionsPopoverProps {
  pageKey: string;
}

export function CardOptionsPopover({
  pageKey,
}: CardOptionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Card options"
        >
          <Eye className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56"
      >
        <p className="mb-2 text-sm font-medium">Card options</p>
        <CardDisplayControls pageKey={pageKey} />
      </PopoverContent>
    </Popover>
  );
}
