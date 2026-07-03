import type { MediaProperty } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateMediaProperty } from "../hooks/useMediaProperties";

interface AddMediaPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created media property so the opener can select it. */
  onCreated?: (mediaProperty: MediaProperty) => void;
}

/** Minimal name-only modal to create a media property inline (e.g. from a book's combobox). */
export function AddMediaPropertyModal({
  open, onOpenChange, onCreated,
}: AddMediaPropertyModalProps) {
  const createMediaProperty = useCreateMediaProperty();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New media property"
      description="Give the media property a name — you can set its sort order later from its edit page."
      placeholder="e.g. The Lord of the Rings"
      submitLabel="Add media property"
      isError={createMediaProperty.isError}
      errorMessage={createMediaProperty.error?.message}
      onSubmit={(name, done) => {
        createMediaProperty.mutate(
          {
            name,
          },
          {
            onSuccess: (mediaProperty) => {
              onCreated?.(mediaProperty);
              done();
            },
          },
        );
      }}
    />
  );
}
