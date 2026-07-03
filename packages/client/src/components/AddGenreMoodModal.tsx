import type { GenreMood } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateGenreMood } from "../hooks/useGenreMoods";

interface AddGenreMoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created entry so the opener can navigate to it. */
  onCreated?: (genreMood: GenreMood) => void;
  /** Fixed parent id — used by the "New sub-entry" button to nest under the current entry. */
  defaultParentId?: string | null;
}

/** Minimal name-only modal to create a Genres & Moods entry inline. */
export function AddGenreMoodModal({
  open, onOpenChange, onCreated, defaultParentId = null,
}: AddGenreMoodModalProps) {
  const createGenreMood = useCreateGenreMood();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={defaultParentId ? "New sub-entry" : "New Genres & Moods entry"}
      description={defaultParentId
        ? "Create an entry under the current one — you can fill in the rest from its edit page."
        : "Give the entry a name — you can fill in the rest from its edit page."}
      placeholder="e.g. Science Fiction"
      submitLabel="Add entry"
      isError={createGenreMood.isError}
      errorMessage={createGenreMood.error?.message}
      onSubmit={(name, done) => {
        createGenreMood.mutate(
          {
            name,
            parentId: defaultParentId,
          },
          {
            onSuccess: (genreMood) => {
              onCreated?.(genreMood);
              done();
            },
          },
        );
      }}
    />
  );
}
