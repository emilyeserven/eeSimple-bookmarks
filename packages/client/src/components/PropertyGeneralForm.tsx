import type { CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const generalSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  enabled: z.boolean(),
});

interface PropertyGeneralFormProps {
  property: CustomProperty;
}

/** Edit a custom property's name, status, and description. Type is immutable and shown for context. */
export function PropertyGeneralForm({
  property,
}: PropertyGeneralFormProps) {
  const navigate = useNavigate();
  const updateProperty = useUpdateCustomProperty();
  const isBuiltIn = property.builtIn;
  const idPrefix = `property-${property.id}`;

  const form = useAppForm({
    defaultValues: {
      name: property.name,
      description: property.description ?? "",
      enabled: property.enabled,
    },
    validators: {
      onChange: generalSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateProperty.mutate({
        id: property.id,
        input: {
          name: value.name.trim(),
          description: value.description.trim() || null,
          enabled: value.enabled,
        },
      }, {
        // Renaming can change the slug, so follow it to keep the edit URL valid.
        onSuccess: (updated) => {
          if (updated.slug !== property.slug) {
            void navigate({
              to: "/custom-properties/$propertySlug/edit/general",
              params: {
                propertySlug: updated.slug,
              },
            });
          }
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              disabled={isBuiltIn}
            />
          )}
        </form.AppField>

        <div className="space-y-1">
          <Label>Type</Label>
          <p className="pt-2 text-sm text-muted-foreground">
            {TYPE_LABELS[property.type]}
            {" — set at creation and can't be changed."}
          </p>
        </div>
      </div>

      <form.AppField name="enabled">
        {field => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-enabled`}
                checked={field.state.value}
                disabled={isBuiltIn}
                onCheckedChange={checked => field.handleChange(checked === true)}
              />
              <Label htmlFor={`${idPrefix}-enabled`}>Property is active</Label>
            </div>
            {isBuiltIn
              ? <p className="text-xs text-muted-foreground">Built-in properties can&apos;t be disabled.</p>
              : null}
          </div>
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label="Description"
            placeholder="Optional — shown as a hint where this property appears."
            rows={2}
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.Subscribe selector={state => state.values}>
          {(values) => {
            const dirty
              = values.name.trim() !== property.name
                || (values.description.trim() || null) !== (property.description ?? null)
                || values.enabled !== property.enabled;
            return (
              <form.SubmitButton
                label="Save changes"
                pendingLabel="Saving…"
                size="sm"
                disabledWhen={!dirty}
              />
            );
          }}
        </form.Subscribe>
      </form.AppForm>
      {updateProperty.isError
        ? <p className="text-sm text-destructive">{updateProperty.error.message}</p>
        : null}
    </form>
  );
}
