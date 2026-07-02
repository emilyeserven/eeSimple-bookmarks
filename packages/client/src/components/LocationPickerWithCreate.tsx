import type { LocationNode } from "@eesimple/types";

import { LocationPicker } from "./LocationPicker";
import { useEntityCreateOption } from "./useEntityCreateOption";

interface LocationPickerWithCreateProps {
  tree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** LocationPicker with a built-in "Create location" option that opens the AddLocationModal. */
export function LocationPickerWithCreate({
  tree, selectedIds, onToggle,
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
        createOption={locationCreate.createOption}
      />
      {locationCreate.modal}
    </>
  );
}
