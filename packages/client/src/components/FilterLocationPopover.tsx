import { Filter } from "lucide-react";

import { usePanelControls } from "./panel/usePanelControls";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUiStore } from "@/stores/uiStore";

type FilterLocation = "sidebar" | "drawer" | "hide";

/** Popover attached to the Filter icon that lets users choose where to display the filter panel. */
export function FilterLocationPopover() {
  const filtersHidden = useUiStore(state => state.filtersHidden);
  const filtersInDrawer = useUiStore(state => state.filtersInDrawer);
  const setFiltersHidden = useUiStore(state => state.setFiltersHidden);
  const setFiltersInDrawer = useUiStore(state => state.setFiltersInDrawer);
  const {
    openType, close, dCT,
  } = usePanelControls();

  const current: FilterLocation = filtersHidden ? "hide" : filtersInDrawer ? "drawer" : "sidebar";

  function handleChange(value: string) {
    if (!value) return;
    const next = value as FilterLocation;
    if (next === "sidebar") {
      setFiltersHidden(false);
      setFiltersInDrawer(false);
      if (dCT === "filters") close();
    }
    else if (next === "drawer") {
      setFiltersHidden(false);
      setFiltersInDrawer(true);
      openType("filters");
    }
    else {
      setFiltersHidden(true);
      setFiltersInDrawer(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Filters"
        >
          <Filter className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto"
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filters</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={current}
            onValueChange={handleChange}
          >
            <ToggleGroupItem value="sidebar">Sidebar</ToggleGroupItem>
            <ToggleGroupItem value="drawer">Drawer</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
