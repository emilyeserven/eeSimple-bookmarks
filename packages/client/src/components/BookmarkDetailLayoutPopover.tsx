import { Columns2 } from "lucide-react";

import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Header control for the bookmark detail page: switches its body between a single stacked column and
 * a vertical-tabbed layout. The choice is a global, persisted preference (`bookmarkDetailLayout`).
 */
export function BookmarkDetailLayoutPopover() {
  const layout = useUiStore(state => state.bookmarkDetailLayout);
  const setLayout = useUiStore(state => state.setBookmarkDetailLayout);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Layout"
        >
          <Columns2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto min-w-56"
      >
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Layout</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={layout}
            className="gap-0 overflow-hidden rounded-md border border-input"
            onValueChange={(next) => {
              if (next) setLayout(next as "single" | "tabbed");
            }}
          >
            <ToggleGroupItem
              value="single"
              className="
                rounded-none border-r border-input
                first:rounded-l-sm
              "
            >
              Single
            </ToggleGroupItem>
            <ToggleGroupItem
              value="tabbed"
              className="
                rounded-none
                last:rounded-r-sm
              "
            >
              Tabbed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
