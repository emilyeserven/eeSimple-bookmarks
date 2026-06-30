import type { PlaceTypeOption } from "../lib/locationLevels";
import type { LocationDisplayMode, PlaceTypeLevelGroup, PlaceTypeLevelGroupConfig } from "@eesimple/types";

import { useMemo } from "react";

import { useLocationLevelGroups, useUpdateLocationLevelGroups } from "./useAppSettings";
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
  addGroup: () => void;
  renameGroup: (id: string, name: string) => void;
  setGroupVisible: (id: string, visible: boolean) => void;
  setGroupDisplayMode: (id: string, displayMode: LocationDisplayMode) => void;
  setGroupPlaceTypes: (id: string, placeTypes: string[]) => void;
  removeGroup: (id: string) => void;
  reorderGroups: (orderedIds: string[]) => void;
} {
  const {
    data: locations, isLoading,
  } = useLocations();
  const stored = useLocationLevelGroups();
  const update = useUpdateLocationLevelGroups();

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

  function addGroup(): void {
    const maxOrder = groups.reduce((max, group) => Math.max(max, group.sortOrder), -1);
    const next: PlaceTypeLevelGroup = {
      id: randomId(),
      name: "New level",
      placeTypes: [],
      displayMode: "area",
      visible: true,
      sortOrder: maxOrder + 1,
    };
    save([...groups, next], "Level group");
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

  function removeGroup(id: string): void {
    const label = groupLabel(id);
    save(groups.filter(group => group.id !== id), `${label} removed`);
  }

  function reorderGroups(orderedIds: string[]): void {
    const byId = new Map(groups.map(group => [group.id, group]));
    const next = orderedIds
      .map((id, index) => {
        const group = byId.get(id);
        return group
          ? {
            ...group,
            sortOrder: index,
          }
          : undefined;
      })
      .filter((group): group is PlaceTypeLevelGroup => group !== undefined);
    save(next, "Level order");
  }

  return {
    groups,
    isLoading,
    isSaving: update.isPending,
    placeTypeOptions: options,
    unassignedPlaceTypes,
    addGroup,
    renameGroup,
    setGroupVisible,
    setGroupDisplayMode,
    setGroupPlaceTypes,
    removeGroup,
    reorderGroups,
  };
}
