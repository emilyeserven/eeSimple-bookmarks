import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useAppForm } from "../lib/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const nameOnlySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

interface InlineCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading, e.g. "New category". */
  title: string;
  /** Muted helper line under the heading. */
  description: string;
  /** Placeholder for the name field, e.g. "e.g. Workflow". */
  placeholder: string;
  /** Submit button label, e.g. "Add category". */
  submitLabel: string;
  /** Submit button label while the create is pending. */
  pendingLabel?: string;
  /**
   * Extra field(s) rendered between the name field and the submit row, e.g. a single flag
   * checkbox. The caller owns this field's state and folds it into its own `onSubmit` mutation —
   * `InlineCreateModal` stays name-only internally. See `AddRelationshipTypeModal`.
   */
  extraFields?: ReactNode;
  /** Whether the underlying create mutation errored. */
  isError: boolean;
  /** Error message to surface when `isError`. */
  errorMessage?: string;
  /**
   * Create the entity from the trimmed `name`. Call `done()` on success — it closes the dialog
   * and resets the field for the next open.
   */
  onSubmit: (name: string, done: () => void) => void;
}

/**
 * Minimal name-(+one-flag) modal for inline entity creation (e.g. from a form combobox's "Add new
 * X"). Owns the Dialog chrome, the name field, validation, and form reset; callers supply the
 * labels and wire `onSubmit` to their `useCreate*` mutation. See `AddCategoryModal` /
 * `AddPropertyGroupModal` for the name-only case and `AddRelationshipTypeModal` for `extraFields`.
 */
export function InlineCreateModal({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  submitLabel,
  pendingLabel,
  extraFields,
  isError,
  errorMessage,
  onSubmit,
}: InlineCreateModalProps) {
  const {
    t,
  } = useTranslation();
  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: nameOnlySchema,
    },
    onSubmit: ({
      value,
    }) => {
      onSubmit(value.name.trim(), () => {
        onOpenChange(false);
        form.reset();
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
                label={t("Name")}
                placeholder={placeholder}
              />
            )}
          </form.AppField>

          {extraFields}

          {isError
            ? <p className="text-sm text-destructive">{errorMessage}</p>
            : null}

          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label={submitLabel}
                pendingLabel={pendingLabel ?? t("Adding…")}
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
