import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { useEffect, useState } from "react";

import { GripVertical, MapPin, Shapes, Trash2 } from "lucide-react";

import { LevelColorControl } from "./LevelColorControl";
import { MultiCombobox } from "./MultiCombobox";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type LevelGroupRowContentProps = GroupRowProps & SortableHandle;

/** The form fields of a level-group row (everything inside the sortable drag wrapper). */
export function LevelGroupRowContent({
  group,
  options,
  renameGroup,
  setGroupVisible,
  setGroupDisplayMode,
  setGroupPlaceTypes,
  setGroupColor,
  removeGroup,
  attributes,
  listeners,
}: LevelGroupRowContentProps) {
  // Local name so typing feels instant; the rename auto-saves on blur.
  const [name, setName] = useState(group.name);
  useEffect(() => {
    setName(group.name);
  }, [group.name]);

  return (
    <>
      <div className="flex items-center gap-3">
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
            <MapPin className="mr-1 size-4" />
            Pin
          </ToggleGroupItem>
          <ToggleGroupItem
            value="area"
            aria-label="Area"
          >
            <Shapes className="mr-1 size-4" />
            Area
          </ToggleGroupItem>
        </ToggleGroup>

        <LevelColorControl
          color={group.color}
          label={group.name}
          onChange={color => setGroupColor(group.id, color)}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id={`loc-group-${group.id}`}
            checked={group.visible}
            onCheckedChange={checked => setGroupVisible(group.id, checked === true)}
          />
          <Label
            htmlFor={`loc-group-${group.id}`}
            className="cursor-pointer"
          >
            Shown
          </Label>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${group.name || "level"}`}
          onClick={() => removeGroup(group.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Place types</Label>
        <MultiCombobox
          options={options.map(option => ({
            value: option.key,
            label: option.label,
          }))}
          values={group.placeTypes}
          onValuesChange={values => setGroupPlaceTypes(group.id, values)}
          placeholder="Assign place types…"
          searchPlaceholder="Search place types…"
          emptyText="No place types discovered yet."
          aria-label={`Place types for ${group.name || "level"}`}
        />
      </div>
    </>
  );
}
