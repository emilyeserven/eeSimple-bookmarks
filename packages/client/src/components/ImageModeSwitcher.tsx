import { useRef, useState } from "react";

import { useBookmarkImageMode } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ImageModeSwitcherProps {
  /** Stable key identifying the page, so each listing remembers its own image display mode. */
  pageKey: string;
}

/** On-page control to choose how listing bookmark images are displayed (natural ratio vs. uniform crop). */
export function ImageModeSwitcher({
  pageKey,
}: ImageModeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageMode = useBookmarkImageMode(pageKey);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 100);
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Images</Label>
      <Popover open={open}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {imageMode ? "Natural" : "Cropped"}
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
            value={imageMode ? "natural" : "cropped"}
            onValueChange={(value) => {
              if (value) setBookmarkImageMode(pageKey, value === "natural");
            }}
          >
            <ToggleGroupItem value="natural">Natural</ToggleGroupItem>
            <ToggleGroupItem value="cropped">Cropped</ToggleGroupItem>
          </ToggleGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
}
