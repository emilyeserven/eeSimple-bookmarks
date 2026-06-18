import type { Category } from "@eesimple/types";

import { z } from "zod";

import { useCreateCategory } from "../hooks/useCategories";
import { useAppForm } from "../lib/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

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

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: addCategorySchema,
    },
    onSubmit: ({
      value,
    }) => {
      createCategory.mutate(
        {
          name: value.name.trim(),
        },
        {
          onSuccess: (category) => {
            onCreated?.(category);
            onOpenChange(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>
            Give the category a name — you can fill in the rest later from its edit page.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                placeholder="e.g. Workflow"
              />
            )}
          </form.AppField>

          {createCategory.isError
            ? <p className="text-sm text-destructive">{createCategory.error.message}</p>
            : null}

          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label="Add category"
                pendingLabel="Adding…"
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
