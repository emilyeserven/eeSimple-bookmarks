import { Eye } from "lucide-react";

import { CardDisplayControls } from "./CardDisplayControls";
import { CardOptionsPreview } from "./CardOptionsPreview";
import { useViewMode } from "../lib/bookmarkColumns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CardOptionsPopoverProps {
  pageKey: string;
}

export function CardOptionsPopover({
  pageKey,
}: CardOptionsPopoverProps) {
  const viewMode = useViewMode(pageKey);
  const isTable = viewMode === "table";
  const label = isTable ? "Column options" : "Card options";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
        >
          <Eye className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto"
      >
        <p className="mb-2 text-sm font-medium">{label}</p>
        <div className="flex gap-4">
          {!isTable && <CardOptionsPreview pageKey={pageKey} />}
          <CardDisplayControls pageKey={pageKey} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
