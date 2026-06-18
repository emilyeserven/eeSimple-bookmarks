import type { HomepageSectionImageLayout } from "../lib/bookmarkColumns";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ImageLayoutSwitcherProps {
  layout: HomepageSectionImageLayout;
  onLayoutChange: (layout: HomepageSectionImageLayout) => void;
}

/** Control to choose image position in 2-column layouts: stacked above content or side-by-side on the left. */
export function ImageLayoutSwitcher({
  layout,
  onLayoutChange,
}: ImageLayoutSwitcherProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 100);
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Layout</Label>
      <Popover open={open}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {layout === "side" ? "Side" : "Above"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onInteractOutside={e => e.preventDefault()}
        >
          <ToggleGroup
            type="single"
            size="sm"
            value={layout}
            onValueChange={(value) => {
              if (value) onLayoutChange(value as HomepageSectionImageLayout);
            }}
          >
            <ToggleGroupItem value="above">Above</ToggleGroupItem>
            <ToggleGroupItem value="side">Side</ToggleGroupItem>
          </ToggleGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
}
