import type { CustomProperty } from "@eesimple/types";

import { z } from "zod";

import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const displaySchema = z.object({
  inForm: z.boolean(),
  advancedOnly: z.boolean(),
  showInListings: z.boolean(),
  editableOnCard: z.boolean(),
});

interface PropertyDisplayFormProps {
  property: CustomProperty;
}

/** Where a custom property appears (form / listings) and whether it's editable from the card menu. */
export function PropertyDisplayForm({
  property,
}: PropertyDisplayFormProps) {
  const updateProperty = useUpdateCustomProperty();
  const isCalculate = property.type === "calculate";
  const idPrefix = `property-${property.id}`;

  const form = useAppForm({
    defaultValues: {
      inForm: !property.hiddenFromForm,
      advancedOnly: !property.showInForm,
      showInListings: property.showInListings,
      editableOnCard: property.editableOnCard,
    },
    validators: {
      onChange: displaySchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateProperty.mutate({
        id: property.id,
        input: {
          hiddenFromForm: !value.inForm,
          showInForm: !value.advancedOnly,
          showInListings: value.showInListings,
          // Calculate values are computed server-side, so they can never be edited from the card menu.
          editableOnCard: isCalculate ? false : value.editableOnCard,
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
      <div className="space-y-2">
        <span className="text-sm font-medium">Show in…</span>
        <div className="space-y-2">
          <form.AppField name="inForm">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-in-form`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-in-form`}>Main bookmark form</Label>
              </div>
            )}
          </form.AppField>
          <form.Subscribe selector={state => state.values.inForm}>
            {inForm =>
              inForm
                ? (
                  <form.AppField name="advancedOnly">
                    {field => (
                      <div className="ml-6 flex items-center gap-2">
                        <Checkbox
                          id={`${idPrefix}-advanced-only`}
                          checked={field.state.value}
                          onCheckedChange={checked => field.handleChange(checked === true)}
                        />
                        <Label
                          htmlFor={`${idPrefix}-advanced-only`}
                          className="text-xs text-muted-foreground"
                        >
                          Only show in Advanced area
                        </Label>
                      </div>
                    )}
                  </form.AppField>
                )
                : null}
          </form.Subscribe>
          <form.AppField name="showInListings">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-show-in-listings`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-show-in-listings`}>Bookmark listings</Label>
              </div>
            )}
          </form.AppField>
        </div>
      </div>

      {isCalculate
        ? null
        : (
          <div className="space-y-2 border-t pt-3">
            <span className="text-sm font-medium">Editing</span>
            <form.AppField name="editableOnCard">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-editable-on-card`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-editable-on-card`}>
                    Allow editing from the bookmark card menu
                  </Label>
                </div>
              )}
            </form.AppField>
          </div>
        )}

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          pendingLabel="Saving…"
          size="sm"
        />
      </form.AppForm>
      {updateProperty.isError
        ? <p className="text-sm text-destructive">{updateProperty.error.message}</p>
        : null}
    </form>
  );
}
