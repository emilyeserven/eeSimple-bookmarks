import type { Category } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateCategory } from "../hooks/useCategories";

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created category so the opener can select it. */
  onCreated?: (category: Category) => void;
}

/** Minimal name-only modal to create a category inline (e.g. from the Bookmark form's combobox). */
export function AddCategoryModal({
  open, onOpenChange, onCreated,
}: AddCategoryModalProps) {
  const createCategory = useCreateCategory();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New category"
      description="Give the category a name — you can fill in the rest later from its edit page."
      placeholder="e.g. Workflow"
      submitLabel="Add category"
      isError={createCategory.isError}
      errorMessage={createCategory.error?.message}
      onSubmit={(name, done) => {
        createCategory.mutate(
          {
            name,
          },
          {
            onSuccess: (category) => {
              onCreated?.(category);
              done();
            },
          },
        );
      }}
    />
  );
}
