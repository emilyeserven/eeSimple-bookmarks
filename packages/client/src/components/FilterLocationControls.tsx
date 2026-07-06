import type { FilterLocation } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  useDisplayPreferenceSettings,
  useFilterLocation,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { usePanelControls } from "./panel/usePanelControls";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * The filter-location chooser body (sidebar / drawer / pills / hide). Shared by `FilterLocationPopover`
 * (desktop popover) and the header More menu's mobile modal — the single source of truth. The enum is
 * persisted directly; the legacy booleans are derived from it server-side (see `resolveFilterLocation`).
 */
export function FilterLocationControls() {
  const current = useFilterLocation();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const {
    openType, close, dCT,
  } = usePanelControls();
  const {
    t,
  } = useTranslation();

  const messages: Record<FilterLocation, string> = {
    sidebar: t("Filters in sidebar"),
    drawer: t("Filters in drawer"),
    pills: t("Filters as pills"),
    hide: t("Filters hidden"),
  };

  function handleChange(value: string) {
    if (!value || !displayData) return;
    const next = value as FilterLocation;
    update.mutate({
      input: {
        ...displayData,
        filterLocation: next,
      },
      successMessage: messages[next],
    });
    // Drawer open/close is local UI — apply it immediately regardless of the save round-trip.
    // Pills and sidebar both live outside the drawer, so close it when leaving the drawer placement.
    if (next === "drawer") {
      openType("filters");
    }
    else if (dCT === "filters") {
      close();
    }
  }

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={current}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={handleChange}
    >
      <ToggleGroupItem
        value="sidebar"
        className="
          rounded-none border-r border-input
          first:rounded-l-sm
        "
      >
        {t("Sidebar")}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="drawer"
        className="rounded-none border-r border-input"
      >
        {t("Drawer")}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="pills"
        className="rounded-none border-r border-input"
      >
        {t("Pills")}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="hide"
        className="
          rounded-none
          last:rounded-r-sm
        "
      >
        {t("Hide")}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
