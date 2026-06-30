import type { PlaceTypeOption } from "../lib/locationLevels";
import type { LocationDisplayMode, PlaceTypeIconConfig, PlaceTypeLevelGroup, PlaceTypeLevelGroupConfig } from "@eesimple/types";

import { useMemo } from "react";

import { LOCATION_MAP_PALETTES } from "@eesimple/types";

import {
  useLocationLevelGroups,
  useLocationPlaceTypeIcons,
  useUpdateLocationLevelGroups,
  useUpdatePlaceTypeIcons,
} from "./useAppSettings";
import { useLocations } from "./useLocations";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { placeTypeOptions } from "../lib/locationLevels";

import { randomId } from "@/lib/utils";

/**
 * The named place-type "level" groups (the source of truth Settings → Locations and the map "Levels"
 * overlay edit) plus the auto-save writers shared by both. Every write persists the whole group array
 * and fires a field-named toast (the per-placeType display config the map/sort consume is derived from
 * these groups, so both surfaces stay in sync). Editing one source of truth keeps them identical.
 */
export function useLocationLevels(): {
  groups: PlaceTypeLevelGroup[];
  isLoading: boolean;
  isSaving: boolean;
  /** Discovered place types (∪ any assigned), label-sorted, for the assignment control. */
  placeTypeOptions: PlaceTypeOption[];
  /** Discovered place types not assigned to any group (they render with the default visible/area). */
  unassignedPlaceTypes: PlaceTypeOption[];
  /** Add a new group with the given display mode, optionally inserted after the group with `afterId`. */
  addGroupOfMode: (displayMode: LocationDisplayMode, afterId?: string) => void;
  renameGroup: (id: string, name: string) => void;
  setGroupVisible: (id: string, visible: boolean) => void;
  setGroupDisplayMode: (id: string, displayMode: LocationDisplayMode) => void;
  setGroupPlaceTypes: (id: string, placeTypes: string[]) => void;
  /** Set (or clear, with `null`) the map color a level's pins/areas render in. */
  setGroupColor: (id: string, color: string | null) => void;
  removeGroup: (id: string) => void;
  /** Reorder all groups to the given order, reassigning sortOrder by position. */
  reorderGroups: (orderedIds: string[]) => void;
  /** Reorder only the groups with the given display mode, preserving the relative positions of others. */
  reorderGroupsInTab: (displayMode: LocationDisplayMode, orderedIds: string[]) => void;
  /** Assign a predefined palette's colors across the groups in display order (wrapping if needed). */
  applyPalette: (paletteId: string) => void;
  /** The per-placeType map-pin icon overrides (placeType key → Lucide icon name). */
  placeTypeIcons: PlaceTypeIconConfig;
  /** Set one place type's map-pin icon (a Lucide name), persisting the whole map with a toast. */
  setPlaceTypeIcon: (placeTypeKey: string, iconName: string) => void;
  /** Clear all per-placeType icon overrides. */
  resetPlaceTypeIcons: () => void;
} {
  const {
    data: locations, isLoading,
  } = useLocations();
  const stored = useLocationLevelGroups();
  const update = useUpdateLocationLevelGroups();
  const placeTypeIcons = useLocationPlaceTypeIcons();
  const updateIcons = useUpdatePlaceTypeIcons();

  // Memoize the derived arrays so their identity is stable across renders while the underlying query
  // data is unchanged. Without this, `groups` (a fresh `[...stored].sort()` each render) is a new
  // reference every render, which makes any `useEffect([groups])` consumer (Settings → Locations)
  // re-run on every render and loop forever.
  const groups = useMemo(
    () => [...stored].sort((a, b) => a.sortOrder - b.sortOrder),
    [stored],
  );
  const assigned = useMemo(
    () => new Set(groups.flatMap(group => group.placeTypes)),
    [groups],
  );
  const options = useMemo(
    () => placeTypeOptions(locations ?? [], [...assigned]),
    [locations, assigned],
  );
  const unassignedPlaceTypes = useMemo(
    () => options.filter(option => !assigned.has(option.key)),
    [options, assigned],
  );

  function save(next: PlaceTypeLevelGroupConfig, label: string): void {
    update.mutate(next, {
      onSuccess: () => notifyFieldSaved(label),
      onError: error => notifyFieldSaveError(label, error.message),
    });
  }

  /** Apply a patch to one group by id, persisting the full reordered-by-sortOrder array. */
  function patchGroup(id: string, patch: Partial<PlaceTypeLevelGroup>, label: string): void {
    save(groups.map(group => (group.id === id
      ? {
        ...group,
        ...patch,
      }
      : group)), label);
  }

  function groupLabel(id: string): string {
    return groups.find(group => group.id === id)?.name || "Level";
  }

  function addGroupOfMode(displayMode: LocationDisplayMode, afterId?: string): void {
    const newGroup: PlaceTypeLevelGroup = {
      id: randomId(),
      name: "New level",
      placeTypes: [],
      displayMode,
      visible: true,
      sortOrder: 0,
    };
    const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    let inserted: PlaceTypeLevelGroup[];
    if (afterId) {
      const idx = sorted.findIndex(g => g.id === afterId);
      inserted = idx !== -1
        ? [...sorted.slice(0, idx + 1), newGroup, ...sorted.slice(idx + 1)]
        : [...sorted, newGroup];
    }
    else {
      inserted = [...sorted, newGroup];
    }
    save(inserted.map((g, i) => ({
      ...g,
      sortOrder: i,
    })), "Level group");
  }

  function renameGroup(id: string, name: string): void {
    patchGroup(id, {
      name,
    }, `${name || "Level"} name`);
  }

  function setGroupVisible(id: string, visible: boolean): void {
    patchGroup(id, {
      visible,
    }, `${groupLabel(id)} visibility`);
  }

  function setGroupDisplayMode(id: string, displayMode: LocationDisplayMode): void {
    patchGroup(id, {
      displayMode,
    }, `${groupLabel(id)} display`);
  }

  function setGroupPlaceTypes(id: string, placeTypes: string[]): void {
    patchGroup(id, {
      placeTypes,
    }, `${groupLabel(id)} place types`);
  }

  function setGroupColor(id: string, color: string | null): void {
    patchGroup(id, {
      color,
    }, `${groupLabel(id)} color`);
  }

  function applyPalette(paletteId: string): void {
    const palette = LOCATION_MAP_PALETTES.find(p => p.id === paletteId);
    if (!palette || palette.colors.length === 0) return;
    const next = groups.map((group, index) => ({
      ...group,
      color: palette.colors[index % palette.colors.length],
    }));
    save(next, `${palette.name} palette`);
  }

  function removeGroup(id: string): void {
    const label = groupLabel(id);
    save(groups.filter(group => group.id !== id), `${label} removed`);
  }

  function reorderGroups(orderedIds: string[]): void {
    const byId = new Map(groups.map(g => [g.id, g]));
    const result = orderedIds
      .map(id => byId.get(id))
      .filter((g): g is PlaceTypeLevelGroup => g !== undefined);
    save(result.map((g, i) => ({
      ...g,
      sortOrder: i,
    })), "Level order");
  }

  function reorderGroupsInTab(displayMode: LocationDisplayMode, newTabIds: string[]): void {
    const allSorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    const byId = new Map(groups.map(g => [g.id, g]));
    const queue = [...newTabIds];
    const result = allSorted.map((g) => {
      if (g.displayMode !== displayMode) return g;
      const nextId = queue.shift();
      return nextId ? (byId.get(nextId) ?? g) : g;
    });
    save(result.map((g, i) => ({
      ...g,
      sortOrder: i,
    })), "Level order");
  }

  function setPlaceTypeIcon(key: string, iconName: string): void {
    const label = `${options.find(option => option.key === key)?.label ?? key} icon`;
    updateIcons.mutate({
      ...placeTypeIcons,
      [key]: iconName,
    }, {
      onSuccess: () => notifyFieldSaved(label),
      onError: error => notifyFieldSaveError(label, error.message),
    });
  }

  function resetPlaceTypeIcons(): void {
    updateIcons.mutate({}, {
      onSuccess: () => notifyFieldSaved("Place type icons"),
      onError: error => notifyFieldSaveError("Place type icons", error.message),
    });
  }

  return {
    groups,
    isLoading,
    isSaving: update.isPending,
    placeTypeOptions: options,
    unassignedPlaceTypes,
    addGroupOfMode,
    renameGroup,
    setGroupVisible,
    setGroupDisplayMode,
    setGroupPlaceTypes,
    setGroupColor,
    removeGroup,
    reorderGroups,
    reorderGroupsInTab,
    applyPalette,
    placeTypeIcons,
    setPlaceTypeIcon,
    resetPlaceTypeIcons,
  };
}
