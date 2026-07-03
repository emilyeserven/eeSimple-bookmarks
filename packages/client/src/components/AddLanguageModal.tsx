import type { Language } from "@eesimple/types";

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

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New language"
      description="Give the language a name — you can set its ISO code from its edit page."
      placeholder="e.g. Esperanto"
      submitLabel="Add language"
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
