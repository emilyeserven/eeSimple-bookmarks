import type { Location } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateLocation } from "../hooks/useLocations";

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created location so the opener can navigate to it. */
  onCreated?: (location: Location) => void;
  /** Fixed parent id — used to nest under the current location. */
  defaultParentId?: string | null;
}

/** Minimal name-only modal to create a location inline. */
export function AddLocationModal({
  open, onOpenChange, onCreated, defaultParentId = null,
}: AddLocationModalProps) {
  const createLocation = useCreateLocation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={defaultParentId ? "New sub-location" : "New location"}
      description={defaultParentId
        ? "Create a location under the current one — you can fill in the rest from its edit page."
        : "Give the location a name — you can fill in the rest from its edit page."}
      placeholder="e.g. Tokyo"
      submitLabel="Add location"
      isError={createLocation.isError}
      errorMessage={createLocation.error?.message}
      onSubmit={(name, done) => {
        createLocation.mutate(
          {
            name,
            parentId: defaultParentId,
          },
          {
            onSuccess: (location) => {
              onCreated?.(location);
              done();
            },
          },
        );
      }}
    />
  );
}
