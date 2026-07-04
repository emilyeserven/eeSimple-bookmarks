import type { Language } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateLanguage } from "../hooks/useLanguages";

interface AddLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created language so the opener can navigate to it. */
  onCreated?: (language: Language) => void;
}

/** Minimal name-only modal to create a language inline. */
export function AddLanguageModal({
  open, onOpenChange, onCreated,
}: AddLanguageModalProps) {
  const createLanguage = useCreateLanguage();
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New language")}
      description={t("Give the language a name — you can set its ISO code from its edit page.")}
      placeholder={t("e.g. Esperanto")}
      submitLabel={t("Add language")}
      isError={createLanguage.isError}
      errorMessage={createLanguage.error?.message}
      onSubmit={(name, done) => {
        createLanguage.mutate(
          {
            name,
          },
          {
            onSuccess: (language) => {
              onCreated?.(language);
              done();
            },
          },
        );
      }}
    />
  );
}
