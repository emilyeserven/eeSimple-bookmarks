import {
  useDisplayPreferenceSettings,
  useFiltersHidden,
  useFiltersInDrawer,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";
import { usePanelControls } from "./panel/usePanelControls";

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

/**
 * The filter-location chooser body (sidebar / drawer / hide). Shared by `FilterLocationPopover`
 * (desktop popover) and the header More menu's mobile modal — the single source of truth.
 */
export function FilterLocationControls() {
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
  );
}
