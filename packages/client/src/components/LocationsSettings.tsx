import type { PlaceTypeLevel } from "../lib/locationLevels";
import type { DragEndEvent } from "@dnd-kit/core";

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
import { GripVertical, MapPin, Shapes } from "lucide-react";

import { useLocationLevels } from "../hooks/useLocationLevels";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface LevelRowProps {
  level: PlaceTypeLevel;
  setLevel: ReturnType<typeof useLocationLevels>["setLevel"];
}

/** A single drag-sortable place-type level row: drag handle + visibility + pin/area choice. */
function SortableLevelRow({
  level, setLevel,
}: LevelRowProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: level.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 py-2",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="
          cursor-grab text-muted-foreground
          active:cursor-grabbing
        "
        aria-label={`Reorder ${level.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex flex-1 items-center gap-2">
        <Checkbox
          id={`loc-level-${level.key}`}
          checked={level.setting.visible}
          onCheckedChange={checked =>
            setLevel(level.key, {
              visible: checked === true,
            }, `${level.label} visibility`)}
        />
        <Label
          htmlFor={`loc-level-${level.key}`}
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
    </div>
  );
}

/**
 * Settings → Locations: configure, per Nominatim place type (auto-discovered from your locations),
 * the default map rendering (pin vs area) and whether that level is shown, plus the level order
 * (drag to reorder). The same server-side config backs the map's "Levels" overlay and the
 * sort-by-place-type option, so changes here apply everywhere. Each change auto-saves with a toast.
 */
export function LocationsSettings() {
  const {
    levels, isLoading, setLevel, reorder,
  } = useLocationLevels();

  // Local order so drag feels instant; re-synced whenever the saved levels change.
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);
  useEffect(() => {
    setOrderedKeys(levels.map(level => level.key));
  }, [levels]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byKey = new Map(levels.map(level => [level.key, level]));
  const orderedLevels = orderedKeys
    .map(key => byKey.get(key))
    .filter((level): level is PlaceTypeLevel => level !== undefined);

  function handleDragEnd(event: DragEndEvent) {
    const {
      active, over,
    } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedKeys.indexOf(String(active.id));
    const newIndex = orderedKeys.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(orderedKeys, oldIndex, newIndex);
    setOrderedKeys(next);
    reorder(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Place-type levels</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : null}

        {!isLoading && orderedLevels.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No place types yet. Locations pick up a place type (city, state, country, …) from their
              geocoding lookup; once you’ve saved a few, their levels appear here.
            </p>
          )
          : null}

        {orderedLevels.length > 0
          ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedKeys}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedLevels.map(level => (
                    <SortableLevelRow
                      key={level.key}
                      level={level}
                      setLevel={setLevel}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )
          : null}
      </CardContent>
    </Card>
  );
}
