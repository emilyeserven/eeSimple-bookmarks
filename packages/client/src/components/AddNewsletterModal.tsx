import type { Newsletter } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateNewsletter } from "../hooks/useNewsletters";

interface AddNewsletterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created newsletter so the opener can select it. */
  onCreated?: (newsletter: Newsletter) => void;
}

/** Minimal name-only modal to create an import inline (e.g. from the import form's combobox). */
export function AddNewsletterModal({
  open, onOpenChange, onCreated,
}: AddNewsletterModalProps) {
  const createNewsletter = useCreateNewsletter();
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New import")}
      description={t("Give the import a name — you can set its default category, tags, and media type later from its edit page.")}
      placeholder={t("e.g. The Pragmatic Engineer")}
      submitLabel={t("Add import")}
      isError={createNewsletter.isError}
      errorMessage={createNewsletter.error?.message}
      onSubmit={(name, done) => {
        createNewsletter.mutate(
          {
            name,
          },
          {
            onSuccess: (newsletter) => {
              onCreated?.(newsletter);
              done();
            },
          },
        );
      }}
    />
  );
}
