import type { AncestorChildrenScopeControls, LevelsControls, MapFilterControls } from "../lib/locationLevels";
import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { DEFAULT_LOCATION_MAP_COLOR, normalizeHexColor } from "@eesimple/types";
import { MapPin, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocationLevelModeToggle } from "./LocationLevelModeToggle";
import { LocationMapFilterSection } from "./LocationMapFilterSection";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the two map "Levels" overlays — {@link LocationLevelsOverlay} (the mobile
 * popover) and {@link LocationLevelsMapPanel} (the desktop floating panel). They render the same
 * checkbox list + "Show" / hide-borders / ancestors / filter footer; keeping the shared pieces here
 * means a level-row/footer change lands in one place instead of being patched in both overlays (the
 * "fix two files per symptom" churn issue #834 targets). The overlays keep only their own container
 * chrome and their differing pin/area affordance (inline per-row on mobile; behind "View Options" on
 * desktop).
 */

/** The small pin/area glyph tinted with a level group's color, shown beside its visibility checkbox. */
export function LevelGroupGlyph({
  group,
}: { group: PlaceTypeLevelGroup }) {
  const color = normalizeHexColor(group.color) ?? DEFAULT_LOCATION_MAP_COLOR;
  return group.displayMode === "pin"
    ? (
      <MapPin
        className="size-3 shrink-0"
        style={{
          color,
        }}
        aria-hidden="true"
      />
    )
    : (
      <Square
        className="size-3 shrink-0"
        style={{
          color,
          fill: color,
        }}
        aria-hidden="true"
      />
    );
}

/**
 * The footer shared by both overlays: the above/current/below "Show" toggle (only where the map has a
 * "current" level), the "Hide map borders" checkbox, the optional "Only direct ancestors/children"
 * checkbox, and the optional map filter section. `compact` renders the desktop panel's tighter spacing
 * and smaller label text; the mobile popover uses the roomier default. Checkbox ids are prefixed per
 * variant so both overlays can coexist in the DOM (one is CSS-hidden per breakpoint) without clashing.
 */
export function LevelsFooter({
  controls,
  ancestorChildrenScope,
  filter,
  compact = false,
}: {
  controls: LevelsControls;
  ancestorChildrenScope?: AncestorChildrenScopeControls;
  filter?: MapFilterControls;
  compact?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const idPrefix = compact ? "map" : "levels";
  const section = compact ? "mt-2 border-t pt-2" : "mt-3 border-t pt-3";
  const labelClass = cn("cursor-pointer", compact && "text-xs");

  return (
    <>
      {controls.levelMode && controls.onLevelModeChange
        ? (
          <div className={section}>
            <LocationLevelModeToggle
              value={controls.levelMode}
              onChange={controls.onLevelModeChange}
            />
          </div>
        )
        : null}

      <div className={cn(section, "flex items-center gap-2")}>
        <Checkbox
          id={`${idPrefix}-hide-admin-borders`}
          checked={controls.hideAdminBorders}
          onCheckedChange={checked => controls.onHideAdminBordersChange(checked === true)}
        />
        <Label
          htmlFor={`${idPrefix}-hide-admin-borders`}
          className={labelClass}
        >
          {t("Hide map borders")}
        </Label>
      </div>

      {ancestorChildrenScope
        ? (
          <div className={cn(section, "flex items-start gap-2")}>
            <Checkbox
              id={`${idPrefix}-only-direct-relatives`}
              checked={ancestorChildrenScope.onlyDirect}
              onCheckedChange={checked => ancestorChildrenScope.onToggle(checked === true)}
            />
            <Label
              htmlFor={`${idPrefix}-only-direct-relatives`}
              className={labelClass}
            >
              {t("Only show direct ancestors/children of current location")}
            </Label>
          </div>
        )
        : null}

      {filter ? <LocationMapFilterSection filter={filter} /> : null}
    </>
  );
}
