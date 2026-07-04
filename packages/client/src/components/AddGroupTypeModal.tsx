import type { GroupType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New group type")}
      description={t("Give the group type a name — you can reorder it later from its listing page.")}
      placeholder={t("e.g. Doujin Circle")}
      submitLabel={t("Add group type")}
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
