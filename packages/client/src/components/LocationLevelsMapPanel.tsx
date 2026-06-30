import { DEFAULT_LOCATION_MAP_COLOR, normalizeHexColor } from "@eesimple/types";
import { MapPin, Settings, Shapes, Square } from "lucide-react";

import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Pin-vs-area selector for each level group, shown in a small popover
 * from the "View Options" button in the map overlay header.
 */
function ViewOptionsPopover({
  groups,
  setGroupDisplayMode,
}: {
  groups: ReturnType<typeof useLocationLevels>["groups"];
  setGroupDisplayMode: ReturnType<typeof useLocationLevels>["setGroupDisplayMode"];
}) {
  if (groups.length === 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="
            h-5 w-auto gap-1 px-1 py-0 text-xs font-normal text-muted-foreground
          "
        >
          <Settings className="size-3" />
          View Options
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 p-3"
      >
        <p className="mb-2 text-xs font-semibold">Display Mode</p>
        <ul className="space-y-2">
          {groups.map(group => (
            <li
              key={group.id}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate text-sm">{group.name || "Level"}</span>
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
                  <MapPin className="size-3" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="area"
                  aria-label="Area"
                >
                  <Shapes className="size-3" />
                </ToggleGroupItem>
              </ToggleGroup>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Persistent map overlay panel for desktop: lists each level group with a visibility checkbox and
 * a color swatch. The pin/area mode controls are tucked behind "View Options" to keep the panel
 * compact. Shown inside the map container (absolutely positioned); hidden on mobile where the
 * dropdown trigger in the map header is used instead.
 */
export function LocationLevelsMapPanel() {
  const {
    groups,
    setGroupVisible,
    setGroupDisplayMode,
  } = useLocationLevels({
    notify: false,
  });

  return (
    <div
      className="
        min-w-40 rounded-lg border bg-background/90 p-2 shadow-sm
        backdrop-blur-sm
      "
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">Levels</span>
        <ViewOptionsPopover
          groups={groups}
          setGroupDisplayMode={setGroupDisplayMode}
        />
      </div>

      {groups.length === 0
        ? (
          <p className="text-xs text-muted-foreground">
            No levels yet.
          </p>
        )
        : (
          <ul className="space-y-1.5">
            {groups.map(group => (
              <li
                key={group.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`map-level-${group.id}`}
                  checked={group.visible}
                  onCheckedChange={checked => setGroupVisible(group.id, checked === true)}
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
                  htmlFor={`map-level-${group.id}`}
                  className="cursor-pointer text-xs"
                >
                  {group.name || "Level"}
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
