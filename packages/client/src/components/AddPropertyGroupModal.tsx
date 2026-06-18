import type { PropertyGroup } from "@eesimple/types";

import { z } from "zod";

import { useCreatePropertyGroup } from "../hooks/usePropertyGroups";
import { useAppForm } from "../lib/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addPropertyGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

interface AddPropertyGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created group so the opener can select it. */
  onCreated?: (group: PropertyGroup) => void;
}

/** Minimal name-only modal to create a property group inline (e.g. from the property form's combobox). */
export function AddPropertyGroupModal({
  open, onOpenChange, onCreated,
}: AddPropertyGroupModalProps) {
  const createGroup = useCreatePropertyGroup();

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: addPropertyGroupSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createGroup.mutate(
        {
          name: value.name.trim(),
        },
        {
          onSuccess: (group) => {
            onCreated?.(group);
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
          <DialogTitle>New property group</DialogTitle>
          <DialogDescription>
            Give the group a name — you can set its priority and description later from its edit page.
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
                placeholder="e.g. Ratings"
              />
            )}
          </form.AppField>

          {createGroup.isError
            ? <p className="text-sm text-destructive">{createGroup.error.message}</p>
            : null}

          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label="Add group"
                pendingLabel="Adding…"
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
