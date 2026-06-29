import type { LocationNode } from "@eesimple/types";

import { useState } from "react";

import { AddLocationModal } from "./AddLocationModal";
import { LocationPicker } from "./LocationPicker";

interface LocationPickerWithCreateProps {
  tree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** LocationPicker with a built-in "Create location" option that opens the AddLocationModal. */
export function LocationPickerWithCreate({
  tree, selectedIds, onToggle,
}: LocationPickerWithCreateProps) {
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  return (
    <>
      <LocationPicker
        tree={tree}
        selectedIds={selectedIds}
        onToggle={onToggle}
        createOption={{
          label: "Create location",
          onSelect: () => setAddLocationOpen(true),
        }}
      />
      <AddLocationModal
        open={addLocationOpen}
        onOpenChange={setAddLocationOpen}
        onCreated={(location) => {
          if (!selectedIds.includes(location.id)) onToggle(location.id);
        }}
      />
    </>
  );
}
