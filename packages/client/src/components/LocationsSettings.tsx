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
import { Plus } from "lucide-react";

import { PlaceTypeIconsCard } from "./PlaceTypeIconsCard";
import { SortableGroupRow } from "./SortableLevelGroupRow";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    placeTypeIcons,
    setPlaceTypeIcon,
    resetPlaceTypeIcons,
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
    <div className="space-y-6">
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

      <PlaceTypeIconsCard
        options={placeTypeOptions}
        icons={placeTypeIcons}
        onSetIcon={setPlaceTypeIcon}
        onReset={resetPlaceTypeIcons}
      />
    </div>
  );
}
