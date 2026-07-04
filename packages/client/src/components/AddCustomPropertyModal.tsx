import type { CustomProperty, CustomPropertyType } from "@eesimple/types";

import { CUSTOM_PROPERTY_TYPES } from "@eesimple/types";
import { z } from "zod";

import { useCreateCustomProperty } from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";
import { TYPE_OPTIONS } from "../lib/propertyForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(CUSTOM_PROPERTY_TYPES),
});

interface AddCustomPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (property: CustomProperty) => void;
}

/** Minimal name + type modal to create a custom property inline from the listing page. */
export function AddCustomPropertyModal({
  open, onOpenChange, onCreated,
}: AddCustomPropertyModalProps) {
  const tLabel = useTranslatedLabel();
  const typeOptions = TYPE_OPTIONS.map(option => ({
    ...option,
    label: tLabel(option.label),
  }));
  const createProperty = useCreateCustomProperty();
  const form = useAppForm({
    defaultValues: {
      name: "",
      type: "number",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({
      value,
    }) => {
      createProperty.mutate(
        {
          name: value.name.trim(),
          type: value.type as CustomPropertyType,
        },
        {
          onSuccess: (property) => {
            onCreated?.(property);
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
          <DialogTitle>New custom property</DialogTitle>
          <DialogDescription>
            Pick a name and type — fill in the rest from its edit page.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                placeholder="e.g. Rating"
              />
            )}
          </form.AppField>
          <form.AppField name="type">
            {field => (
              <field.SelectField
                label="Type"
                options={typeOptions}
              />
            )}
          </form.AppField>
          {createProperty.isError
            ? <p className="text-sm text-destructive">{createProperty.error.message}</p>
            : null}
          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label="Add property"
                pendingLabel="Adding…"
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
