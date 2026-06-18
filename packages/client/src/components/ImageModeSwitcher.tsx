import { useBookmarkImageMode, useBookmarkImageVisibility } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

interface ImageModeSwitcherProps {
  /** Stable key identifying the page, so each listing remembers its own image display settings. */
  pageKey: string;
}

/**
 * On-page control for how listing bookmark images are displayed: a "Display" section (show the full
 * card, the image only, or no image) and an "Aspect" section (natural ratio vs. uniform crop).
 */
export function ImageModeSwitcher({
  pageKey,
}: ImageModeSwitcherProps) {
  const imageMode = useBookmarkImageMode(pageKey);
  const visibility = useBookmarkImageVisibility(pageKey);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);
  const setBookmarkImageVisibility = useUiStore(state => state.setBookmarkImageVisibility);

  const triggerLabel = visibility === "off"
    ? "Off"
    : visibility === "image-only"
      ? "Image only"
      : imageMode ? "Natural" : "Cropped";

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Images</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            {triggerLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Display
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={visibility === "shown"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => setBookmarkImageVisibility(pageKey, "shown")}
          >
            Show
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={visibility === "image-only"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => setBookmarkImageVisibility(pageKey, "image-only")}
          >
            Image only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={visibility === "off"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => setBookmarkImageVisibility(pageKey, "off")}
          >
            Off
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Aspect
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={imageMode}
            disabled={visibility === "off"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => setBookmarkImageMode(pageKey, true)}
          >
            Natural
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={!imageMode}
            disabled={visibility === "off"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => setBookmarkImageMode(pageKey, false)}
          >
            Cropped
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
