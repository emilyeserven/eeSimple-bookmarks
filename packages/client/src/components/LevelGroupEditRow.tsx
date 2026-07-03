import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { useEffect, useState } from "react";

import { MapPin, Shapes, Trash2, TriangleAlert } from "lucide-react";

import { LevelColorControl } from "./LevelColorControl";
import { LevelGroupDragHandle } from "./LevelGroupDragHandle";
import { LocationLevelModeToggle } from "./LocationLevelModeToggle";
import { MultiCombobox } from "./MultiCombobox";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type LevelGroupEditRowProps = GroupRowProps & SortableHandle & {
  /** Leave edit mode (collapse back to the summary view). */
  onDone: () => void;
};

/** The expanded (editing) view of a level-group row: name, color, mode, main-map toggle, place types. */
export function LevelGroupEditRow({
  group,
  allGroups,
  options,
  takenPlaceTypes,
  renameGroup,
  setGroupShowOnMainMap,
  setGroupDisplayMode,
  setGroupLevelMode,
  setGroupDefaultHidden,
  setGroupPlaceTypes,
  setGroupColor,
  removeGroup,
  onDone,
  attributes,
  listeners,
}: LevelGroupEditRowProps) {
  // Local name so typing feels instant; the rename auto-saves on blur.
  const [name, setName] = useState(group.name);
  useEffect(() => {
    setName(group.name);
  }, [group.name]);

  const duplicatePlaceTypes = new Set(group.placeTypes.filter(pt => takenPlaceTypes.has(pt)));

  const hiddenByDefault = new Set(group.defaultHiddenGroupIds ?? []);
  function toggleDefaultVisible(targetId: string, visible: boolean): void {
    const next = new Set(hiddenByDefault);
    // Checked = visible by default → the target is NOT in the hidden set.
    if (visible) next.delete(targetId);
    else next.add(targetId);
    setGroupDefaultHidden(group.id, [...next]);
  }

  return (
    <div className="space-y-2">
      {/* Row 1: name input */}
      <div className="flex items-center gap-2">
        <LevelGroupDragHandle
          label={group.name}
          attributes={attributes}
          listeners={listeners}
        />

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
            onClick={onDone}
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

      {/* Row 4: default "Show" mode for maps anchored at this level */}
      <div className="space-y-1 pl-6">
        <LocationLevelModeToggle
          value={group.levelMode ?? "current"}
          onChange={mode => setGroupLevelMode(group.id, mode)}
        />
        <p className="text-xs text-muted-foreground">
          Which levels a place&rsquo;s map (or a bookmark&rsquo;s map, when one of its tagged
          locations is this level) shows by default when this is its own level — broader levels too,
          only this level, or narrower levels. The map&rsquo;s Levels overlay edits the same default.
        </p>
      </div>

      {/* Row 4b: per-anchor default-visibility checklist for maps anchored at this level */}
      <div className="space-y-1.5 pl-6">
        <Label className="text-xs text-muted-foreground">Levels visible by default</Label>
        <p className="text-xs text-muted-foreground">
          When this is a map&rsquo;s current level, only the checked levels show by default. The
          &ldquo;Show&rdquo; buttons above still bound the range — unchecking a level removes it from
          the default — and a map&rsquo;s Levels overlay can still turn any level back on for that map.
        </p>
        <div className="space-y-1 pt-0.5">
          {allGroups.map(other => (
            <div
              key={other.id}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`level-default-${group.id}-${other.id}`}
                checked={!hiddenByDefault.has(other.id)}
                onCheckedChange={checked => toggleDefaultVisible(other.id, checked === true)}
              />
              <Label
                htmlFor={`level-default-${group.id}-${other.id}`}
                className="cursor-pointer text-xs font-normal"
              >
                {other.name || <span className="italic">Unnamed level</span>}
                {other.id === group.id
                  ? <span className="text-muted-foreground"> (this level)</span>
                  : null}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: place type assignment */}
      <div className="space-y-1 pl-6">
        <Label className="text-xs text-muted-foreground">Place types</Label>
        <MultiCombobox
          options={options.map(option => ({
            value: option.key,
            label: option.label,
            // Never disable a value already assigned to this group — even one also taken by
            // another group (a duplicate) — or it becomes impossible to click off.
            disabled: takenPlaceTypes.has(option.key) && !group.placeTypes.includes(option.key),
          }))}
          values={group.placeTypes}
          onValuesChange={values => setGroupPlaceTypes(group.id, values)}
          placeholder="Assign place types…"
          searchPlaceholder="Search place types…"
          emptyText="No place types discovered yet."
          aria-label={`Place types for ${group.name || "level"}`}
        />
        {duplicatePlaceTypes.size > 0
          ? (
            <p className="flex items-center gap-1 text-xs text-amber-600">
              <TriangleAlert className="size-3 shrink-0" />
              Also assigned to another level:
              {" "}
              {[...duplicatePlaceTypes].join(", ")}
              . Open the picker above and click it again to remove it from this level.
            </p>
          )
          : null}
      </div>
    </div>
  );
}
