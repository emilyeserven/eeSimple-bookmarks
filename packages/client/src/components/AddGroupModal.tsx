import type { Group } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateGroup } from "../hooks/useGroups";

interface AddGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created group so the opener can navigate to it. */
  onCreated?: (group: Group) => void;
}

/** Minimal name-only modal to create a group inline. */
export function AddGroupModal({
  open, onOpenChange, onCreated,
}: AddGroupModalProps) {
  const createGroup = useCreateGroup();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New group"
      description="Give the group a name — you can fill in the rest from its edit page."
      placeholder="e.g. Penguin Random House"
      submitLabel="Add group"
      isError={createGroup.isError}
      errorMessage={createGroup.error?.message}
      onSubmit={(name, done) => {
        createGroup.mutate(
          {
            name,
          },
          {
            onSuccess: (group) => {
              onCreated?.(group);
              done();
            },
          },
        );
      }}
    />
  );
}
