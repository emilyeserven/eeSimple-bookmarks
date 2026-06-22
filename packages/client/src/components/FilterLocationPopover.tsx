import { Filter } from "lucide-react";

import {
  useDisplayPreferenceSettings,
  useFiltersHidden,
  useFiltersInDrawer,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";
import { usePanelControls } from "./panel/usePanelControls";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FilterLocation = "sidebar" | "drawer" | "hide";

const LOCATION_PATCH: Record<FilterLocation, { filtersHidden: boolean;
  filtersInDrawer: boolean;
  message: string; }> = {
  sidebar: {
    filtersHidden: false,
    filtersInDrawer: false,
    message: "Filters in sidebar",
  },
  drawer: {
    filtersHidden: false,
    filtersInDrawer: true,
    message: "Filters in drawer",
  },
  hide: {
    filtersHidden: true,
    filtersInDrawer: false,
    message: "Filters hidden",
  },
};

/** Popover attached to the Filter icon that lets users choose where to display the filter panel. */
export function FilterLocationPopover() {
  const filtersHidden = useFiltersHidden();
  const filtersInDrawer = useFiltersInDrawer();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const {
    openType, close, dCT,
  } = usePanelControls();

  const current: FilterLocation = filtersHidden ? "hide" : filtersInDrawer ? "drawer" : "sidebar";

  function handleChange(value: string) {
    if (!value || !displayData) return;
    const next = value as FilterLocation;
    const {
      filtersHidden: hidden, filtersInDrawer: inDrawer, message,
    } = LOCATION_PATCH[next];
    update.mutate({
      ...displayData,
      filtersHidden: hidden,
      filtersInDrawer: inDrawer,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: error => notifyError(error.message),
    });
    // Drawer open/close is local UI — apply it immediately regardless of the save round-trip.
    if (next === "sidebar") {
      if (dCT === "filters") close();
    }
    else if (next === "drawer") {
      openType("filters");
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
