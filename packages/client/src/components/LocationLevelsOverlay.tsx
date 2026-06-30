import { Layers, MapPin, Shapes } from "lucide-react";

import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Map "Levels" overlay: a popover (modal on mobile) listing each Nominatim place type present in the
 * data with a visibility checkbox and a pin/area choice. Writes straight through to the **server**
 * per-placeType config (shared with Settings → Locations), so a toggle here changes the global
 * default everywhere and fires a toast.
 */
export function LocationLevelsOverlay() {
  const {
    levels, setLevel,
  } = useLocationLevels();

  return (
    <ResponsivePopover
      title="Levels"
      description="Choose which place types appear on the map and how each renders."
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
      {levels.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            No place types yet. Locations pick up a place type from their geocoding lookup.
          </p>
        )
        : (
          <ul className="space-y-2">
            {levels.map(level => (
              <li
                key={level.key}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`level-${level.key}`}
                    checked={level.setting.visible}
                    onCheckedChange={checked =>
                      setLevel(level.key, {
                        visible: checked === true,
                      }, `${level.label} visibility`)}
                  />
                  <Label
                    htmlFor={`level-${level.key}`}
                    className="cursor-pointer"
                  >
                    {level.label}
                  </Label>
                </div>
                <ToggleGroup
                  type="single"
                  size="sm"
                  variant="outline"
                  value={level.setting.displayMode}
                  onValueChange={(value) => {
                    if (value === "pin" || value === "area") {
                      setLevel(level.key, {
                        displayMode: value,
                      }, `${level.label} display`);
                    }
                  }}
                  aria-label={`${level.label} display mode`}
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
    </ResponsivePopover>
  );
}
