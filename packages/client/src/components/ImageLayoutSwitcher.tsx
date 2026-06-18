import type { HomepageSectionImageLayout } from "../lib/bookmarkColumns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

interface ImageLayoutSwitcherProps {
  layout: HomepageSectionImageLayout;
  onLayoutChange: (layout: HomepageSectionImageLayout) => void;
}

/** Control to choose image position in 2-column layouts: stacked above content or side-by-side on the left. */
export function ImageLayoutSwitcher({
  layout,
  onLayoutChange,
}: ImageLayoutSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Layout</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            {layout === "side" ? "Side" : "Above"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            checked={layout === "above"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => onLayoutChange("above")}
          >
            Above
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={layout === "side"}
            onSelect={e => e.preventDefault()}
            onCheckedChange={() => onLayoutChange("side")}
          >
            Side
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
