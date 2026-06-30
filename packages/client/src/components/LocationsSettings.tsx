import type { DragEndEvent } from "@dnd-kit/core";
import type { LocationDisplayMode, PlaceTypeLevelGroup } from "@eesimple/types";

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
import { Layers, MapPin, Plus, Shapes } from "lucide-react";

import { PlaceTypeIconsCard } from "./PlaceTypeIconsCard";
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

const DISPLAY_MODE_CONFIG = {
  pin: {
    icon: MapPin,
    label: "Pin",
    description: "Levels that always render as map pins.",
    empty: "No pin levels yet. Add one to group place types that always show as pins on the map.",
  },
  area: {
    icon: Shapes,
    label: "Area",
    description: "Levels that render as boundary areas (falling back to a pin when no boundary exists).",
    empty: "No area levels yet. Add one to group place types that render as boundary areas on the map.",
  },
} as const;

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
    setGroupVisible,
    setGroupPlaceTypes,
    setGroupColor,
    removeGroup,
    reorderGroupsInTab,
    applyPalette,
    placeTypeIcons,
    setPlaceTypeIcon,
    resetPlaceTypeIcons,
  } = useLocationLevels();

  const [outerTab, setOuterTab] = useState<"level-groups" | "pin-icons">("level-groups");
  const [levelTab, setLevelTab] = useState<LocationDisplayMode>("pin");

  // Local ordered IDs for each tab, re-synced when the saved groups change.
  const [orderedPinIds, setOrderedPinIds] = useState<string[]>([]);
  const [orderedAreaIds, setOrderedAreaIds] = useState<string[]>([]);
  useEffect(() => {
    const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    setOrderedPinIds(sorted.filter(g => g.displayMode === "pin").map(g => g.id));
    setOrderedAreaIds(sorted.filter(g => g.displayMode === "area").map(g => g.id));
  }, [groups]);

  const byId = new Map(groups.map(g => [g.id, g]));
  const orderedPinGroups = orderedPinIds
    .map(id => byId.get(id))
    .filter((g): g is PlaceTypeLevelGroup => g !== undefined);
  const orderedAreaGroups = orderedAreaIds
    .map(id => byId.get(id))
    .filter((g): g is PlaceTypeLevelGroup => g !== undefined);

  const currentGroups = levelTab === "pin" ? orderedPinGroups : orderedAreaGroups;
  const currentIds = levelTab === "pin" ? orderedPinIds : orderedAreaIds;

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
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(currentIds, oldIndex, newIndex);
    if (levelTab === "pin") setOrderedPinIds(next);
    else setOrderedAreaIds(next);
    reorderGroupsInTab(levelTab, next);
  }

  const modeCfg = DISPLAY_MODE_CONFIG[levelTab];

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
        {outerTab === "level-groups"
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

                {/* Horizontal Pin / Area tab switcher */}
                <nav
                  aria-label="Level group display mode"
                  className="flex gap-1 border-b pb-1"
                >
                  {(["pin", "area"] as const).map((tab) => {
                    const cfg = DISPLAY_MODE_CONFIG[tab];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setLevelTab(tab)}
                        className={cn(
                          `
                            flex items-center gap-1.5 rounded-md px-3 py-1.5
                            text-sm font-medium transition-colors
                          `,
                          levelTab === tab
                            ? "bg-accent text-accent-foreground"
                            : `
                              text-muted-foreground
                              hover:bg-accent/50 hover:text-foreground
                            `,
                        )}
                      >
                        <Icon className="size-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </nav>

                {/* Display mode tab content */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{modeCfg.description}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => addGroupOfMode(levelTab)}
                    >
                      <Plus className="mr-1 size-4" />
                      Add level
                    </Button>
                  </div>

                  {isLoading
                    ? <p className="text-sm text-muted-foreground">Loading…</p>
                    : null}

                  {!isLoading && currentGroups.length === 0
                    ? (
                      <p className="text-sm text-muted-foreground">{modeCfg.empty}</p>
                    )
                    : null}

                  {currentGroups.length > 0
                    ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={currentIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <div>
                            {currentGroups.map((group, index) => (
                              <div key={group.id}>
                                <SortableGroupRow
                                  group={group}
                                  options={placeTypeOptions}
                                  renameGroup={renameGroup}
                                  setGroupVisible={setGroupVisible}
                                  setGroupPlaceTypes={setGroupPlaceTypes}
                                  setGroupColor={setGroupColor}
                                  removeGroup={removeGroup}
                                />
                                {index < currentGroups.length - 1
                                  ? (
                                    <AddLevelGap
                                      onClick={() => addGroupOfMode(levelTab, group.id)}
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
                </div>
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
