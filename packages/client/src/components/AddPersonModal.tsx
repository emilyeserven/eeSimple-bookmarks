import type { Person } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New person")}
      description={t("Give the person a name — you can assign them to bookmarks from the bookmark form.")}
      placeholder={t("e.g. Jane Doe")}
      submitLabel={t("Add person")}
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
