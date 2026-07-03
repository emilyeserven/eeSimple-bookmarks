import type { GroupType } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateGroupType } from "../hooks/useGroupTypes";

interface AddGroupTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created group type so the opener can select it. */
  onCreated?: (groupType: GroupType) => void;
}

/** Minimal name-only modal to create a group type inline (e.g. from a Group's edit form). */
export function AddGroupTypeModal({
  open, onOpenChange, onCreated,
}: AddGroupTypeModalProps) {
  const createGroupType = useCreateGroupType();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New group type"
      description="Give the group type a name — you can reorder it later from its listing page."
      placeholder="e.g. Doujin Circle"
      submitLabel="Add group type"
      isError={createGroupType.isError}
      errorMessage={createGroupType.error?.message}
      onSubmit={(name, done) => {
        createGroupType.mutate(
          {
            name,
          },
          {
            onSuccess: (groupType) => {
              onCreated?.(groupType);
              done();
            },
          },
        );
      }}
    />
  );
}
