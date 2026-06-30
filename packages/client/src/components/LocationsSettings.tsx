import type { DragEndEvent } from "@dnd-kit/core";
import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DEFAULT_LOCATION_MAP_COLOR, LOCATION_MAP_PALETTES } from "@eesimple/types";
import { GripVertical, MapPin, Plus, Shapes, Trash2, X } from "lucide-react";

import { MultiCombobox } from "./MultiCombobox";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Levels = ReturnType<typeof useLocationLevels>;

interface GroupRowProps {
  group: PlaceTypeLevelGroup;
  options: Levels["placeTypeOptions"];
  renameGroup: Levels["renameGroup"];
  setGroupVisible: Levels["setGroupVisible"];
  setGroupDisplayMode: Levels["setGroupDisplayMode"];
  setGroupPlaceTypes: Levels["setGroupPlaceTypes"];
  setGroupColor: Levels["setGroupColor"];
  removeGroup: Levels["removeGroup"];
}

/**
 * Swatch + native color picker for a level's map color. Edits a local copy for a live preview and
 * auto-saves on blur (when the picker closes), matching the on-change/on-blur auto-save standard. The
 * trailing reset clears back to Leaflet's default blue.
 */
function LevelColorControl({
  color, label, onChange,
}: {
  color: string | null | undefined;
  label: string;
  onChange: (color: string | null) => void;
}) {
  const [local, setLocal] = useState(color ?? DEFAULT_LOCATION_MAP_COLOR);
  useEffect(() => {
    setLocal(color ?? DEFAULT_LOCATION_MAP_COLOR);
  }, [color]);

  return (
    <div className="flex items-center gap-1">
      <label
        className="
          relative inline-flex size-9 cursor-pointer items-center justify-center
          rounded-md border bg-background
        "
        title="Map color"
      >
        <span
          className="size-5 rounded-sm border"
          style={{
            backgroundColor: local,
          }}
        />
        <input
          type="color"
          value={local}
          onChange={event => setLocal(event.target.value)}
          onBlur={() => {
            if ((color ?? DEFAULT_LOCATION_MAP_COLOR) !== local) onChange(local);
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`${label || "Level"} map color`}
        />
      </label>
      {color
        ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Reset ${label || "level"} color`}
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" />
          </Button>
        )
        : null}
    </div>
  );
}

/** A single drag-sortable level-group card: name + visibility + pin/area + place-type assignment. */
function SortableGroupRow({
  group,
  options,
  renameGroup,
  setGroupVisible,
  setGroupDisplayMode,
  setGroupPlaceTypes,
  setGroupColor,
  removeGroup,
}: GroupRowProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: group.id,
  });

  // Local name so typing feels instant; the rename auto-saves on blur.
  const [name, setName] = useState(group.name);
  useEffect(() => {
    setName(group.name);
  }, [group.name]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "space-y-3 rounded-lg border bg-card p-3",
        isDragging && "opacity-60",
      )}
    >
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
    </div>
  );
}

/**
 * Settings → Locations: define named "level" groups, each grouping one or more Nominatim place types
 * (auto-discovered from your locations) under a shared map rendering (pin vs area), visibility, and
 * order (drag to reorder). The same server-side groups back the map's "Levels" overlay and the
 * sort-by-place-type option, so changes here apply everywhere. Each change auto-saves with a toast.
 */
export function LocationsSettings() {
  const {
    groups,
    isLoading,
    placeTypeOptions,
    unassignedPlaceTypes,
    addGroup,
    renameGroup,
    setGroupVisible,
    setGroupDisplayMode,
    setGroupPlaceTypes,
    setGroupColor,
    removeGroup,
    reorderGroups,
    applyPalette,
  } = useLocationLevels();

  // Local order so drag feels instant; re-synced whenever the saved groups change.
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  useEffect(() => {
    setOrderedIds(groups.map(group => group.id));
  }, [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byId = new Map(groups.map(group => [group.id, group]));
  const orderedGroups = orderedIds
    .map(id => byId.get(id))
    .filter((group): group is PlaceTypeLevelGroup => group !== undefined);

  function handleDragEnd(event: DragEndEvent) {
    const {
      active, over,
    } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);
    reorderGroups(next);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Level groups</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addGroup}
        >
          <Plus className="mr-1 size-4" />
          Add level
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : null}

        {!isLoading && orderedGroups.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No level groups yet. Add a level (e.g. “Country”, “Region”, “City”) and assign the place
              types (city, state, country, …) discovered from your locations to it.
            </p>
          )
          : null}

        {orderedGroups.length > 0
          ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Apply a color palette across your levels (top to bottom), then fine-tune any level’s
                color individually.
              </p>
              <div className="flex flex-wrap gap-2">
                {LOCATION_MAP_PALETTES.map(palette => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => applyPalette(palette.id)}
                    className="
                      flex items-center gap-2 rounded-md border px-2 py-1
                      text-xs
                      hover:bg-accent
                    "
                    title={`Apply the ${palette.name} palette`}
                  >
                    <span className="flex overflow-hidden rounded-sm">
                      {palette.colors.map(color => (
                        <span
                          key={color}
                          className="size-3"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                      ))}
                    </span>
                    {palette.name}
                  </button>
                ))}
              </div>
            </div>
          )
          : null}

        {orderedGroups.length > 0
          ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {orderedGroups.map(group => (
                    <SortableGroupRow
                      key={group.id}
                      group={group}
                      options={placeTypeOptions}
                      renameGroup={renameGroup}
                      setGroupVisible={setGroupVisible}
                      setGroupDisplayMode={setGroupDisplayMode}
                      setGroupPlaceTypes={setGroupPlaceTypes}
                      setGroupColor={setGroupColor}
                      removeGroup={removeGroup}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )
          : null}

        {unassignedPlaceTypes.length > 0
          ? (
            <p className="text-xs text-muted-foreground">
              Unassigned place types (shown as areas by default):
              {" "}
              {unassignedPlaceTypes.map(option => option.label).join(", ")}
              .
            </p>
          )
          : null}
      </CardContent>
    </Card>
  );
}
