import type { MediaType } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateMediaType } from "../hooks/useMediaTypes";

interface AddMediaTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created media type so the opener can navigate to it. */
  onCreated?: (mediaType: MediaType) => void;
}

/** Minimal name-only modal to create a media type inline. */
export function AddMediaTypeModal({
  open, onOpenChange, onCreated,
}: AddMediaTypeModalProps) {
  const createMediaType = useCreateMediaType();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New media type"
      description="Give the media type a name — you can fill in the rest from its edit page."
      placeholder="e.g. Newsletter"
      submitLabel="Add media type"
      isError={createMediaType.isError}
      errorMessage={createMediaType.error?.message}
      onSubmit={(name, done) => {
        createMediaType.mutate(
          {
            name,
          },
          {
            onSuccess: (mediaType) => {
              onCreated?.(mediaType);
              done();
            },
          },
        );
      }}
    />
  );
}
