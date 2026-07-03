import type { Person } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreatePerson } from "../hooks/usePeople";

interface AddPersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created person so the opener can select it. */
  onCreated?: (person: Person) => void;
}

/** Minimal name-only modal to create an person inline. */
export function AddPersonModal({
  open, onOpenChange, onCreated,
}: AddPersonModalProps) {
  const createPerson = useCreatePerson();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New person"
      description="Give the person a name — you can assign them to bookmarks from the bookmark form."
      placeholder="e.g. Jane Doe"
      submitLabel="Add person"
      isError={createPerson.isError}
      errorMessage={createPerson.error?.message}
      onSubmit={(name, done) => {
        createPerson.mutate(
          {
            name,
          },
          {
            onSuccess: (person) => {
              onCreated?.(person);
              done();
            },
          },
        );
      }}
    />
  );
}
