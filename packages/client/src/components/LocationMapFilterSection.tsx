import type { MapFilterControls } from "../lib/locationLevels";

import { useTranslation } from "react-i18next";

import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { locationNodesToOptions } from "../lib/tagTree";

/**
 * The "Filter" section shown under the level list in the map's Levels overlays. A hierarchical,
 * multi-select location combobox that focuses the map on the chosen place(s) and their descendants;
 * an empty selection shows every location. Shared by the desktop panel and the mobile popover so
 * both surfaces filter the same way.
 */
export function LocationMapFilterSection({
  filter,
}: {
  filter: MapFilterControls;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="mt-2 border-t pt-2">
      <p className="mb-1.5 text-xs font-semibold">{t("Filter")}</p>
      {/* A comfortable min width so the panel — and the trigger-width-matched popover — grow to fit
          deep, long hierarchical entries instead of truncating. */}
      <div className="min-w-64">
        <TreeMultiCombobox
          options={locationNodesToOptions(filter.tree)}
          values={filter.filterIds}
          onValuesChange={filter.onFilterChange}
          placeholder={t("Filter locations…")}
          searchPlaceholder={t("Search locations…")}
          emptyText={t("No locations match.")}
          aria-label={t("Filter map by location")}
        />
      </div>
    </div>
  );
}
