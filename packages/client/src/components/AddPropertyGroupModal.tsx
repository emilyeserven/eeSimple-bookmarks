import type { PropertyGroup } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreatePropertyGroup } from "../hooks/usePropertyGroups";

interface AddPropertyGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created group so the opener can select it. */
  onCreated?: (group: PropertyGroup) => void;
}

/** Minimal name-only modal to create a property group inline (e.g. from the property form's combobox). */
export function AddPropertyGroupModal({
  open, onOpenChange, onCreated,
}: AddPropertyGroupModalProps) {
  const createGroup = useCreatePropertyGroup();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New property group"
      description="Give the group a name — you can set its priority and description later from its edit page."
      placeholder="e.g. Ratings"
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
