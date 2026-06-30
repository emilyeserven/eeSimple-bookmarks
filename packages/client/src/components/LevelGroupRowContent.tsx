import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { useEffect, useState } from "react";

import { DEFAULT_LOCATION_MAP_COLOR } from "@eesimple/types";
import { GripVertical, Map as MapIcon, MapPin, Shapes, Trash2 } from "lucide-react";

import { LevelColorControl } from "./LevelColorControl";
import { MultiCombobox } from "./MultiCombobox";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type LevelGroupRowContentProps = GroupRowProps & SortableHandle;

/** The form fields of a level-group row (everything inside the sortable drag wrapper). */
export function LevelGroupRowContent({
  group,
  options,
  takenPlaceTypes,
  renameGroup,
  setGroupShowOnMainMap,
  setGroupDisplayMode,
  setGroupPlaceTypes,
  setGroupColor,
  removeGroup,
  attributes,
  listeners,
}: LevelGroupRowContentProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Local name so typing feels instant; the rename auto-saves on blur.
  const [name, setName] = useState(group.name);
  useEffect(() => {
    setName(group.name);
  }, [group.name]);

  const colorSwatch = group.color ?? DEFAULT_LOCATION_MAP_COLOR;

  const dragHandle = (
    <button
      type="button"
      className="
        cursor-grab text-muted-foreground
        active:cursor-grabbing
      "
      aria-label={`Reorder ${group.name || "level"}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  if (!isEditing) {
    return (
      <div className="space-y-1.5">
        {/* Row 1: summary line */}
        <div className="flex items-center gap-2">
          {dragHandle}

          <span
            className="size-4 shrink-0 rounded-sm"
            style={{
              backgroundColor: colorSwatch,
            }}
            aria-hidden="true"
          />

          <span className="flex-1 truncate text-sm font-medium">
            {group.name || <span className="text-muted-foreground italic">Unnamed level</span>}
          </span>

          <span
            className={cn(
              `
                flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs
                text-muted-foreground
              `,
            )}
          >
            {group.displayMode === "area"
              ? <Shapes className="size-3" />
              : <MapPin className="size-3" />}
            {group.displayMode === "area" ? "Area" : "Pin"}
          </span>

          {group.showOnMainMap !== false
            ? (
              <span
                className="
                  flex items-center gap-1 rounded-full border px-2 py-0.5
                  text-xs text-muted-foreground
                "
                title="Shown by default on the main map"
              >
                <MapIcon className="size-3" />
                Main map
              </span>
            )
            : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>

        {/* Row 2: place types summary */}
        <p className="pl-6 text-xs text-muted-foreground">
          {group.placeTypes.length > 0
            ? group.placeTypes.join(", ")
            : <span className="italic">No place types assigned</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Row 1: name input */}
      <div className="flex items-center gap-2">
        {dragHandle}

        <Input
          value={name}
          onChange={event => setName(event.target.value)}
          onBlur={() => {
            if (name !== group.name) renameGroup(group.id, name.trim());
          }}
          aria-label="Level name"
          placeholder="Level name"
          className="h-9 flex-1"
        />
      </div>

      {/* Row 2: controls */}
      <div
        className="
          flex flex-col gap-2 pl-6
          sm:flex-row sm:items-center
        "
      >
        <LevelColorControl
          color={group.color}
          label={group.name}
          onChange={color => setGroupColor(group.id, color)}
        />

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
            Pin
          </ToggleGroupItem>
          <ToggleGroupItem
            value="area"
            aria-label="Area"
          >
            <Shapes className="size-3" />
            Area
          </ToggleGroupItem>
        </ToggleGroup>

        <div
          className="
            flex items-center gap-1
            sm:ml-auto
          "
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeGroup(group.id)}
            aria-label={`Remove ${group.name || "level"}`}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Done
          </Button>
        </div>
      </div>

      {/* Row 3: main-map default */}
      <div className="flex items-center gap-2 pl-6">
        <Checkbox
          id={`level-main-map-${group.id}`}
          checked={group.showOnMainMap !== false}
          onCheckedChange={checked => setGroupShowOnMainMap(group.id, checked === true)}
        />
        <Label
          htmlFor={`level-main-map-${group.id}`}
          className="cursor-pointer text-xs font-normal"
        >
          Show by default on main map
        </Label>
      </div>

      {/* Row 4: place type assignment */}
      <div className="space-y-1 pl-6">
        <Label className="text-xs text-muted-foreground">Place types</Label>
        <MultiCombobox
          options={options.map(option => ({
            value: option.key,
            label: option.label,
            disabled: takenPlaceTypes.has(option.key),
          }))}
          values={group.placeTypes}
          onValuesChange={values => setGroupPlaceTypes(group.id, values)}
          placeholder="Assign place types…"
          searchPlaceholder="Search place types…"
          emptyText="No place types discovered yet."
          aria-label={`Place types for ${group.name || "level"}`}
        />
      </div>
    </div>
  );
}
