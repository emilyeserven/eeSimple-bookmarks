import type { PlaceType } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreatePlaceType } from "../hooks/usePlaceTypes";

interface AddPlaceTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created place type so the opener can select it. */
  onCreated?: (placeType: PlaceType) => void;
}

/** Minimal name-only modal to create a place type inline (e.g. from a Location's edit form). */
export function AddPlaceTypeModal({
  open, onOpenChange, onCreated,
}: AddPlaceTypeModalProps) {
  const createPlaceType = useCreatePlaceType();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New place type"
      description="Give the place type a name — you can reorder it later from Settings → Locations."
      placeholder="e.g. Shrine"
      submitLabel="Add place type"
      isError={createPlaceType.isError}
      errorMessage={createPlaceType.error?.message}
      onSubmit={(name, done) => {
        createPlaceType.mutate(
          {
            name,
          },
          {
            onSuccess: (placeType) => {
              onCreated?.(placeType);
              done();
            },
          },
        );
      }}
    />
  );
}
