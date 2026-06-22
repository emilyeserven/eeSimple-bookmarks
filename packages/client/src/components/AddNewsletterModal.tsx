import type { Newsletter } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateNewsletter } from "../hooks/useNewsletters";

interface AddNewsletterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created newsletter so the opener can select it. */
  onCreated?: (newsletter: Newsletter) => void;
}

/** Minimal name-only modal to create a newsletter inline (e.g. from the import form's combobox). */
export function AddNewsletterModal({
  open, onOpenChange, onCreated,
}: AddNewsletterModalProps) {
  const createNewsletter = useCreateNewsletter();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New newsletter"
      description="Give the newsletter a name — you can set its default category, tags, and media type later from its edit page."
      placeholder="e.g. The Pragmatic Engineer"
      submitLabel="Add newsletter"
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
