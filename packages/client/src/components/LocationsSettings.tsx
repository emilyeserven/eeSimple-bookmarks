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
import { Globe2, Layers, MapPin, Plus } from "lucide-react";

import { PlaceTypeIconsCard } from "./PlaceTypeIconsCard";
import { PlaceTypesCard } from "./PlaceTypesCard";
import { SortableGroupRow } from "./SortableLevelGroupRow";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

const OUTER_TABS = [
  {
    key: "level-groups" as const,
    icon: Layers,
    label: "Level Groups",
  },
  {
    key: "pin-icons" as const,
    icon: MapPin,
    label: "Pin Icons",
  },
  {
    key: "place-types" as const,
    icon: Globe2,
    label: "Place Types",
  },
];

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
    addGroupOfMode,
    renameGroup,
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

  const [outerTab, setOuterTab] = useState<"level-groups" | "pin-icons" | "place-types">("level-groups");

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
    <div
      className="
        flex gap-4
        sm:gap-6
      "
    >
      {/* Page-level vertical tab nav */}
      <nav
        aria-label="Locations settings sections"
        className="flex w-32 shrink-0 flex-col gap-1"
      >
        {OUTER_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setOuterTab(tab.key)}
              className={cn(
                `
                  flex items-center gap-2 rounded-md px-3 py-2 text-sm
                  font-medium whitespace-nowrap transition-colors
                `,
                outerTab === tab.key
                  ? "bg-accent text-accent-foreground"
                  : `
                    text-muted-foreground
                    hover:bg-accent/50 hover:text-foreground
                  `,
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      <div className="min-w-0 flex-1">
        {outerTab === "place-types"
          ? <PlaceTypesCard />
          : outerTab === "level-groups"
          ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Level Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groups.length > 0
                  ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Apply a color palette across your levels (top to bottom), then fine-tune each
                        color individually.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {LOCATION_MAP_PALETTES.map(palette => (
                          <button
                            key={palette.id}
                            type="button"
                            onClick={() => applyPalette(palette.id)}
                            className="
                              flex items-center gap-2 rounded-md border px-2
                              py-1 text-xs
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
                                setGroupDisplayMode={setGroupDisplayMode}
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
          )
          : (
            <PlaceTypeIconsCard
              options={placeTypeOptions}
              groups={groups}
              icons={placeTypeIcons}
              onSetIcon={setPlaceTypeIcon}
              onReset={resetPlaceTypeIcons}
            />
          )}
      </div>
    </div>
  );
}
