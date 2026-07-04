import type { Group } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New group")}
      description={t("Give the group a name — you can fill in the rest from its edit page.")}
      placeholder={t("e.g. Penguin Random House")}
      submitLabel={t("Add group")}
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
