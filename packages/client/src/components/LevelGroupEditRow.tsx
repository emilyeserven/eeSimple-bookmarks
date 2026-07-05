import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { useEffect, useState } from "react";

import { MapPin, Shapes, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
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
          aria-label={t("Level name")}
          placeholder={t("Level name")}
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
          aria-label={t("{{name}} display mode", {
            name: group.name || t("Level"),
          })}
        >
          <ToggleGroupItem
            value="pin"
            aria-label={t("Pin")}
          >
            <MapPin className="size-3" />
            {t("Pin")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="area"
            aria-label={t("Area")}
          >
            <Shapes className="size-3" />
            {t("Area")}
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
            aria-label={t("Remove {{name}}", {
              name: group.name || t("level"),
            })}
          >
            <Trash2 className="size-4" />
            {t("Remove")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDone}
          >
            {t("Done")}
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
          {t("Show by default on main map")}
        </Label>
      </div>

      {/* Row 4: default "Show" mode for maps anchored at this level */}
      <div className="space-y-1 pl-6">
        <LocationLevelModeToggle
          value={group.levelMode ?? "current"}
          onChange={mode => setGroupLevelMode(group.id, mode)}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "Which levels a place’s map (or a bookmark’s map, when one of its tagged locations is this level) shows by default when this is its own level — broader levels too, only this level, or narrower levels. The map’s Levels overlay edits the same default.",
          )}
        </p>
      </div>

      {/* Row 4b: per-anchor default-visibility checklist for maps anchored at this level */}
      <div className="space-y-1.5 pl-6">
        <Label className="text-xs text-muted-foreground">{t("Levels visible by default")}</Label>
        <p className="text-xs text-muted-foreground">
          {t(
            "When this is a map’s current level, only the checked levels show by default. The “Show” buttons above still bound the range — unchecking a level removes it from the default — and a map’s Levels overlay can still turn any level back on for that map.",
          )}
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
                {other.name || <span className="italic">{t("Unnamed level")}</span>}
                {other.id === group.id
                  ? <span className="text-muted-foreground"> {t("(this level)")}</span>
                  : null}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: place type assignment */}
      <div className="space-y-1 pl-6">
        <Label className="text-xs text-muted-foreground">{t("Place types")}</Label>
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
          placeholder={t("Assign place types…")}
          searchPlaceholder={t("Search place types…")}
          emptyText={t("No place types discovered yet.")}
          aria-label={t("Place types for {{name}}", {
            name: group.name || t("level"),
          })}
        />
        {duplicatePlaceTypes.size > 0
          ? (
            <p className="flex items-center gap-1 text-xs text-amber-600">
              <TriangleAlert className="size-3 shrink-0" />
              {t("Also assigned to another level:")}
              {" "}
              {[...duplicatePlaceTypes].join(", ")}
              {t(". Open the picker above and click it again to remove it from this level.")}
            </p>
          )
          : null}
      </div>
    </div>
  );
}
