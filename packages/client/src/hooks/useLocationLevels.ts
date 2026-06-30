import type { PlaceTypeLevel } from "../lib/locationLevels";
import type { PlaceTypeDisplayConfig, PlaceTypeDisplaySetting } from "@eesimple/types";

import {
  usePlaceTypeDisplayConfig,
  useUpdateLocationDisplaySettings,
} from "./useAppSettings";
import { useLocations } from "./useLocations";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { buildPlaceTypeLevels, defaultPlaceTypeSetting } from "../lib/locationLevels";

/**
 * The place-type "levels" (discovered ∪ configured), plus the auto-save writers shared by the
 * Settings → Locations page and the map "Levels" overlay. Every write persists the whole
 * server-side config and fires a field-named toast (the same config backs both surfaces, so they
 * stay in sync). The map level overlay and Settings therefore edit one source of truth.
 */
export function useLocationLevels(): {
  levels: PlaceTypeLevel[];
  isLoading: boolean;
  isSaving: boolean;
  setLevel: (key: string, patch: Partial<PlaceTypeDisplaySetting>, label: string) => void;
  reorder: (orderedKeys: string[]) => void;
} {
  const {
    data: locations, isLoading,
  } = useLocations();
  const config = usePlaceTypeDisplayConfig();
  const update = useUpdateLocationDisplaySettings();
  const levels = buildPlaceTypeLevels(locations ?? [], config);

  function save(next: PlaceTypeDisplayConfig, label: string): void {
    update.mutate(next, {
      onSuccess: () => notifyFieldSaved(label),
      onError: error => notifyFieldSaveError(label, error.message),
    });
  }

  function setLevel(key: string, patch: Partial<PlaceTypeDisplaySetting>, label: string): void {
    const current = config[key] ?? defaultPlaceTypeSetting(key, config);
    save({
      ...config,
      [key]: {
        ...current,
        ...patch,
      },
    }, label);
  }

  function reorder(orderedKeys: string[]): void {
    const next: PlaceTypeDisplayConfig = {
      ...config,
    };
    orderedKeys.forEach((key, index) => {
      const current = config[key] ?? defaultPlaceTypeSetting(key, config);
      next[key] = {
        ...current,
        sortOrder: index,
      };
    });
    save(next, "Level order");
  }

  return {
    levels,
    isLoading,
    isSaving: update.isPending,
    setLevel,
    reorder,
  };
}
