import type { LocationSortMode } from "../lib/locationSort";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";

import { useUiStore } from "@/stores/uiStore";

/**
 * The Locations listing's sort-mode control, rendered in the search box's `sort` slot (like the normal
 * listing pages). Offers Default (server/tree order), Place Type, and Location Relation — the last two
 * regroup every level by that attribute's rank. Reads/writes the per-device `locationSortMode` uiStore
 * pref consumed by `useLocationSortedTree` (`entities/location.tsx`).
 */
export function LocationSortToggle() {
  const {
    t,
  } = useTranslation();
  const sortMode = useUiStore(state => state.locationSortMode);
  const setSortMode = useUiStore(state => state.setLocationSortMode);

  const options = [
    {
      value: "default",
      label: t("Default"),
    },
    {
      value: "place-type",
      label: t("Place type"),
    },
    {
      value: "location-relation",
      label: t("Location relation"),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span
        className="
          hidden text-sm text-muted-foreground
          sm:inline
        "
      >{t("Sort")}
      </span>
      <div className="w-44">
        <Combobox
          options={options}
          value={sortMode}
          onValueChange={(value) => {
            if (value === "default" || value === "place-type" || value === "location-relation") {
              setSortMode(value as LocationSortMode);
            }
          }}
          aria-label={t("Sort locations")}
        />
      </div>
    </div>
  );
}
