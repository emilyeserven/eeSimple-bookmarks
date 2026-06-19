import type { BookmarkImageVisibility, HomepageSectionImageLayout } from "../lib/bookmarkColumns";

import { SlidersHorizontal } from "lucide-react";

import { COLUMN_OPTIONS, useBookmarkColumns, useBookmarkImageLayout, useBookmarkImageMode, useBookmarkImageVisibility } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ListingOptionsPopoverProps {
  pageKey: string;
  showsImages: boolean;
}

export function ListingOptionsPopover({
  pageKey, showsImages,
}: ListingOptionsPopoverProps) {
  const columns = useBookmarkColumns(pageKey);
  const imageMode = useBookmarkImageMode(pageKey);
  const imageVisibility = useBookmarkImageVisibility(pageKey);
  const imageLayout = useBookmarkImageLayout(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);
  const setBookmarkImageVisibility = useUiStore(state => state.setBookmarkImageVisibility);
  const setBookmarkImageLayout = useUiStore(state => state.setBookmarkImageLayout);

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
        className="w-auto"
      >
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Columns</Label>
            <Select
              value={String(columns)}
              onValueChange={value => setBookmarkColumns(pageKey, Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="w-16"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_OPTIONS.map(option => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showsImages && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Images</Label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={imageVisibility}
                  onValueChange={(value) => {
                    if (value) setBookmarkImageVisibility(pageKey, value as BookmarkImageVisibility);
                  }}
                >
                  <ToggleGroupItem value="shown">Show</ToggleGroupItem>
                  <ToggleGroupItem value="image-only">Image only</ToggleGroupItem>
                  <ToggleGroupItem value="off">Off</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {imageVisibility !== "off" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Aspect</Label>
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
                </div>
              )}

              {imageVisibility === "shown" && (columns === 1 || columns === 2) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Layout</Label>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={imageLayout}
                    onValueChange={(value) => {
                      if (value) setBookmarkImageLayout(pageKey, value as HomepageSectionImageLayout);
                    }}
                  >
                    <ToggleGroupItem value="above">Above</ToggleGroupItem>
                    <ToggleGroupItem value="side">Side</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
