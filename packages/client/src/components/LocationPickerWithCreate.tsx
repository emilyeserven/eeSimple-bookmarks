import type { LocationNode } from "@eesimple/types";

import { LocationPicker } from "./LocationPicker";
import { useEntityCreateOption } from "./useEntityCreateOption";

interface LocationPickerWithCreateProps {
  tree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Per-item cascade "match child items" toggle (condition editors only). Omit for plain selection. */
  cascadeValues?: string[];
  onToggleCascade?: (id: string) => void;
}

/** LocationPicker with a built-in "Create location" option that opens the AddLocationModal. */
export function LocationPickerWithCreate({
  tree, selectedIds, onToggle, cascadeValues, onToggleCascade,
}: LocationPickerWithCreateProps) {
  const locationCreate = useEntityCreateOption("location", (location) => {
    if (!selectedIds.includes(location.id)) onToggle(location.id);
  });

  return (
    <>
      <LocationPicker
        tree={tree}
        selectedIds={selectedIds}
        onToggle={onToggle}
        cascadeValues={cascadeValues}
        onToggleCascade={onToggleCascade}
        createOption={locationCreate.createOption}
      />
      {locationCreate.modal}
    </>
  );
}
