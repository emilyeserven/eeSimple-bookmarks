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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LOCATION_MAP_PALETTES } from "@eesimple/types";
import { ArrowLeftRight, Plus } from "lucide-react";

import { SortableGroupRow } from "./SortableLevelGroupRow";
import {
  useDisplayPreferenceSettings,
  useMinAreaPinThresholdKm2,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** A subtle clickable gap between two level group rows — hover reveals a "+" to insert a new level. */
function AddLevelGap({
  onClick,
}: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add level here"
      className="
        group flex h-6 w-full items-center gap-2 text-muted-foreground/25
        transition-colors
        hover:text-muted-foreground
      "
    >
      <div className="h-px flex-1 bg-current" />
      <Plus
        className="
          size-3 opacity-0 transition-opacity
          group-hover:opacity-100
        "
      />
      <div className="h-px flex-1 bg-current" />
    </button>
  );
}

/**
 * Settings → Locations → Level Groups: define named "level" groups, each grouping one or more
 * Nominatim place types (auto-discovered from your locations) under a shared map rendering (pin vs
 * area), visibility, and order (drag to reorder). The same server-side groups back the map's "Levels"
 * overlay and the sort-by-place-type option, so changes here apply everywhere. Each change auto-saves
 * with a toast.
 */
export function LocationLevelGroupsSettings() {
  const {
    groups,
    isLoading,
    placeTypeOptions,
    unassignedPlaceTypes,
    addGroupOfMode,
    renameGroup,
    setGroupVisible,
    setGroupShowOnMainMap,
    setGroupDisplayMode,
    setGroupLevelMode,
    setGroupPlaceTypes,
    setGroupColor,
    removeGroup,
    reorderGroups,
    applyPalette,
  } = useLocationLevels();

  // Palette-application options — affect only the next "apply palette" click, not stored per group.
  const [paletteReversed, setPaletteReversed] = useState(false);
  const [paletteIncludesPins, setPaletteIncludesPins] = useState(true);

  const minAreaKm2 = useMinAreaPinThresholdKm2();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const updatePrefs = useUpdateDisplayPreferenceSettings();
  const [minAreaInput, setMinAreaInput] = useState(String(minAreaKm2));
  useEffect(() => {
    setMinAreaInput(String(minAreaKm2));
  }, [minAreaKm2]);

  function commitMinArea() {
    const parsed = Math.max(0, Number(minAreaInput) || 0);
    setMinAreaInput(String(parsed));
    if (parsed === minAreaKm2 || !displayPrefs) return;
    updatePrefs.mutate({
      input: {
        ...displayPrefs,
        minAreaPinThresholdKm2: parsed,
      },
      successMessage: "Minimum area threshold updated",
    });
  }

  // Local ordered IDs, re-synced when the saved groups change.
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  useEffect(() => {
    const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    setOrderedIds(sorted.map(g => g.id));
  }, [groups]);

  const byId = new Map(groups.map(g => [g.id, g]));
  const orderedGroups = orderedIds
    .map(id => byId.get(id))
    .filter((g): g is PlaceTypeLevelGroup => g !== undefined);

  const takenPlaceTypesByGroup = new Map(
    orderedGroups.map(g => [
      g.id,
      new Set(orderedGroups.filter(o => o.id !== g.id).flatMap(o => o.placeTypes)),
    ]),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      <CardHeader>
        <CardTitle className="text-base">Level Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="min-area-pin-threshold"
            className="text-sm font-medium"
          >
            Minimum area size
          </Label>
          <p className="text-xs text-muted-foreground">
            An &ldquo;area&rdquo; level whose boundary is smaller than this (km²) renders as a pin
            instead of a polygon. Set to 0 to always draw the area when a boundary exists.
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="min-area-pin-threshold"
              type="number"
              min={0}
              step="any"
              value={minAreaInput}
              onChange={e => setMinAreaInput(e.target.value)}
              onBlur={commitMinArea}
              className="w-28"
              aria-label="Minimum area size in square kilometers"
            />
            <span className="text-sm text-muted-foreground">km²</span>
          </div>
        </div>

        {groups.length > 0
          ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Apply a color palette across your levels, spread evenly from your largest level
                down to your smallest, then fine-tune each color individually.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaletteReversed(reversed => !reversed)}
                  className="
                    flex items-center gap-1.5 rounded-md border px-2 py-1
                    text-xs
                    hover:bg-accent
                  "
                  title="Flip which end of the palette is used for your largest level"
                >
                  <ArrowLeftRight className="size-3.5" />
                  {paletteReversed
                    ? "Palette start = smallest"
                    : "Palette start = largest"}
                </button>

                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="palette-include-pins"
                    checked={paletteIncludesPins}
                    onCheckedChange={checked => setPaletteIncludesPins(checked === true)}
                  />
                  <Label
                    htmlFor="palette-include-pins"
                    className="
                      cursor-pointer text-xs font-normal text-muted-foreground
                    "
                  >
                    Color pin levels too (otherwise pins stay gray)
                  </Label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {LOCATION_MAP_PALETTES.map(palette => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => applyPalette(palette.id, {
                      reverse: paletteReversed,
                      includePins: paletteIncludesPins,
                    })}
                    className="
                      flex items-center gap-2 rounded-md border px-2 py-1
                      text-xs
                      hover:bg-accent
                    "
                    title={`Apply the ${palette.name} palette`}
                  >
                    <span
                      className="flex h-3 overflow-hidden rounded-sm"
                    >
                      {palette.colors.map((color, index) => (
                        <span
                          key={`${color}-${index}`}
                          className="h-full w-1.5"
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

        <div className="flex items-start justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => addGroupOfMode("pin")}
          >
            <Plus className="mr-1 size-4" />
            Add level
          </Button>
        </div>

        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : null}

        {!isLoading && orderedGroups.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No levels yet. Add one to group place types for map rendering and sorting.
            </p>
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
                <div>
                  {orderedGroups.map((group, index) => (
                    <div key={group.id}>
                      <SortableGroupRow
                        group={group}
                        options={placeTypeOptions}
                        takenPlaceTypes={takenPlaceTypesByGroup.get(group.id) ?? new Set()}
                        renameGroup={renameGroup}
                        setGroupVisible={setGroupVisible}
                        setGroupShowOnMainMap={setGroupShowOnMainMap}
                        setGroupDisplayMode={setGroupDisplayMode}
                        setGroupLevelMode={setGroupLevelMode}
                        setGroupPlaceTypes={setGroupPlaceTypes}
                        setGroupColor={setGroupColor}
                        removeGroup={removeGroup}
                      />
                      {index < orderedGroups.length - 1
                        ? (
                          <AddLevelGap
                            onClick={() => addGroupOfMode("pin", group.id)}
                          />
                        )
                        : null}
                    </div>
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
