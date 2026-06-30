import type { LevelsControls, MapFilterControls } from "../lib/locationLevels";

import { DEFAULT_LOCATION_MAP_COLOR, normalizeHexColor } from "@eesimple/types";
import { Layers, MapPin, Shapes, Square } from "lucide-react";

import { LocationLevelModeToggle } from "./LocationLevelModeToggle";
import { LocationMapFilterSection } from "./LocationMapFilterSection";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Map "Levels" overlay: a popover (modal on mobile) listing each named level group with a visibility
 * checkbox and a pin/area choice. Writes straight through to the **server** level groups (shared with
 * Settings → Locations), so a toggle here changes the global default everywhere and fires a toast.
 * Defining groups and assigning place types to them happens in Settings → Locations.
 */
export function LocationLevelsOverlay({
  controls,
  filter,
}: {
  controls: LevelsControls;
  filter?: MapFilterControls;
}) {
  const {
    groups, setGroupDisplayMode,
  } = useLocationLevels({
    notify: false,
  });

  return (
    <ResponsivePopover
      title="Levels"
      description="Choose which level groups appear on the map and how each renders."
      align="end"
      trigger={(
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <Layers className="mr-2 size-4" />
          Levels
        </Button>
      )}
    >
      {groups.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            No level groups yet. Define them in Settings → Locations.
          </p>
        )
        : (
          <ul className="space-y-2">
            {groups.map(group => (
              <li
                key={group.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`level-${group.id}`}
                    checked={controls.visibleIds.has(group.id)}
                    onCheckedChange={checked => controls.onToggleVisible(group.id, checked === true)}
                  />
                  {group.displayMode === "pin"
                    ? (
                      <MapPin
                        className="size-3 shrink-0"
                        style={{
                          color: normalizeHexColor(group.color) ?? DEFAULT_LOCATION_MAP_COLOR,
                        }}
                        aria-hidden="true"
                      />
                    )
                    : (
                      <Square
                        className="size-3 shrink-0"
                        style={{
                          color: normalizeHexColor(group.color) ?? DEFAULT_LOCATION_MAP_COLOR,
                          fill: normalizeHexColor(group.color) ?? DEFAULT_LOCATION_MAP_COLOR,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  <Label
                    htmlFor={`level-${group.id}`}
                    className="cursor-pointer"
                  >
                    {group.name || "Level"}
                  </Label>
                </div>
                <ToggleGroup
                  type="single"
                  size="sm"
                  variant="outline"
                  value={group.displayMode}
                  onValueChange={(value) => {
                    if (value === "pin" || value === "area") {
                      setGroupDisplayMode(group.id, value);
                    }
                  }}
                  aria-label={`${group.name || "Level"} display mode`}
                >
                  <ToggleGroupItem
                    value="pin"
                    aria-label="Pin"
                  >
                    <MapPin className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="area"
                    aria-label="Area"
                  >
                    <Shapes className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </li>
            ))}
          </ul>
        )}

      {controls.levelMode && controls.onLevelModeChange
        ? (
          <div className="mt-3 border-t pt-3">
            <LocationLevelModeToggle
              value={controls.levelMode}
              onChange={controls.onLevelModeChange}
            />
          </div>
        )
        : null}

      {filter ? <LocationMapFilterSection filter={filter} /> : null}
    </ResponsivePopover>
  );
}
