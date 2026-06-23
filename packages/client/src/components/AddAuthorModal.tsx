import type { Author } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateAuthor } from "../hooks/useAuthors";

interface AddAuthorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created author so the opener can select it. */
  onCreated?: (author: Author) => void;
}

/** Minimal name-only modal to create an author inline. */
export function AddAuthorModal({
  open, onOpenChange, onCreated,
}: AddAuthorModalProps) {
  const createAuthor = useCreateAuthor();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New author"
      description="Give the author a name — you can assign them to bookmarks from the bookmark form."
      placeholder="e.g. Jane Doe"
      submitLabel="Add author"
      isError={createAuthor.isError}
      errorMessage={createAuthor.error?.message}
      onSubmit={(name, done) => {
        createAuthor.mutate(
          {
            name,
          },
          {
            onSuccess: (author) => {
              onCreated?.(author);
              done();
            },
          },
        );
      }}
    />
  );
}
