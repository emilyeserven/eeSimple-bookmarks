import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { useEffect, useState } from "react";

import { GripVertical, Star, Trash2 } from "lucide-react";

import { LevelColorControl } from "./LevelColorControl";
import { MultiCombobox } from "./MultiCombobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LevelGroupRowContentProps = GroupRowProps & SortableHandle;

/** The form fields of a level-group row (everything inside the sortable drag wrapper). */
export function LevelGroupRowContent({
  group,
  options,
  renameGroup,
  setGroupVisible,
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
    <div className="space-y-2">
      {/* Row 1: title — on its own row on all screen sizes */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* Row 2: controls — stack on mobile, inline on desktop */}
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

        <button
          type="button"
          onClick={() => setGroupVisible(group.id, !group.visible)}
          aria-label={group.visible ? `Hide ${group.name || "level"}` : `Show ${group.name || "level"}`}
          aria-pressed={group.visible}
          title={group.visible ? "Visible on map" : "Hidden from map"}
          className={cn(
            `
              rounded-sm p-1 transition-colors
              hover:bg-accent
            `,
            group.visible ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          <Star
            className={cn(
              "size-4",
              group.visible ? "fill-yellow-400" : "fill-none",
            )}
          />
        </button>

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

      {/* Row 3: place type assignment */}
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
    </div>
  );
}
