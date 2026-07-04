import type { PropertyFormSection } from "./propertyFormSchema";
import type {
  Category,
  CreateCustomPropertyInput,
  CustomProperty,
  MediaType,
  PropertyGroup,
} from "@eesimple/types";
import type { ReactNode } from "react";

import {
  CREATE_DEFAULTS,
  payloadFromValues,
  PropertyDisplaySection,
  propertySchema,
  sectionVisibility,
  TYPE_OPTIONS,
  valuesFromProperty,
} from "./propertyFormParts";
import { PropertyOptionsSection } from "./PropertyOptionsSection";
import { PropertyCategoriesSection, PropertyMediaTypesSection } from "./PropertyScopeSections";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

interface PropertyFormProps {
  /** `create` shows an editable Type select; `edit` locks Type (it is immutable) and prefills values. */
  mode: "create" | "edit";
  categories: Category[];
  /** Media types offered in the "Media Types" section for scoping (roots + children). */
  mediaTypes: MediaType[];
  /** Number properties offered as Calculate operands (exclude the property being edited). */
  numberProperties: CustomProperty[];
  /** Property groups offered in the Display tab's "Group" combobox. */
  propertyGroups: PropertyGroup[];
  /** The property to edit; required in `edit` mode. */
  property?: CustomProperty;
  /** Receives the built payload; the update route ignores `type`. */
  onSubmit: (payload: CreateCustomPropertyInput) => void;
  submitLabel: string;
  pendingLabel?: string;
  /** Reset back to blank defaults after a successful submit (used by the create form). */
  resetOnSubmit?: boolean;
  /** A mutation error to surface beneath the submit button. */
  errorMessage?: string;
  /** Extra controls rendered alongside the submit button (e.g. a Delete button). */
  actions?: ReactNode;
  /** Unique prefix for category checkbox ids so multiple forms can coexist on a page. */
  idPrefix: string;
  /**
   * Render only one section (a single edit tab) instead of the whole form. The form still validates
   * and submits every field — the property is prefilled, so saving from any tab persists the full
   * record. Omit to render the complete form (create page + right panel).
   */
  section?: PropertyFormSection;
}

/** Renders a `<Separator />` only in the full form (omitted when a single tab is shown). */
function FormSeparator({
  show,
}: {
  show: boolean;
}) {
  return show ? <Separator /> : null;
}

/** Shared create/edit form for a custom property, used by the settings page and the right panel. */
export function PropertyForm({
  mode,
  categories,
  mediaTypes,
  numberProperties,
  propertyGroups,
  property,
  onSubmit,
  submitLabel,
  pendingLabel,
  resetOnSubmit,
  errorMessage,
  actions,
  idPrefix,
  section,
}: PropertyFormProps) {
  const tLabel = useTranslatedLabel();
  const typeOptions = TYPE_OPTIONS.map(option => ({
    ...option,
    label: tLabel(option.label),
  }));
  const isBuiltIn = mode === "edit" && Boolean(property?.builtIn);
  const groupOptions = [...propertyGroups]
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .map(group => ({
      value: group.id,
      label: group.name,
    }));
  // When `section` is set we render a single tab; the dividers/collapsibles only make sense in the
  // full form, and a section's collapsible defaults to open.
  const {
    full, showGeneral, showOptions, showCategories, showMediaTypes, showDisplay,
  } = sectionVisibility(section);
  const form = useAppForm({
    defaultValues: property ? valuesFromProperty(property) : CREATE_DEFAULTS,
    validators: {
      onChange: propertySchema,
    },
    onSubmit: ({
      value,
    }) => {
      onSubmit(payloadFromValues(value));
      if (resetOnSubmit) form.reset();
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {showGeneral
        ? (
          <div className="space-y-4">
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
                    placeholder="e.g. Priority"
                  />
                )}
              </form.AppField>

              <form.AppField name="type">
                {field => (
                  <field.SelectField
                    label="Type"
                    options={typeOptions}
                    disabled={mode === "edit"}
                  />
                )}
              </form.AppField>
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
          </div>
        )
        : null}

      {showOptions
        ? (
          <PropertyOptionsSection
            form={form}
            idPrefix={idPrefix}
            mode={mode}
            numberProperties={numberProperties}
            section={section}
            full={full}
          />
        )
        : null}

      <FormSeparator show={full} />

      {showCategories && (
        <PropertyCategoriesSection
          form={form}
          categories={categories}
          idPrefix={idPrefix}
          mode={mode}
          section={section}
        />
      )}

      <FormSeparator show={full} />

      {showMediaTypes && (
        <PropertyMediaTypesSection
          form={form}
          mediaTypes={mediaTypes}
          idPrefix={idPrefix}
          section={section}
        />
      )}

      <FormSeparator show={full} />

      {showDisplay
        ? (
          <PropertyDisplaySection
            form={form}
            idPrefix={idPrefix}
            groupOptions={groupOptions}
          />
        )
        : null}

      <FormSeparator show={full} />

      <div className="flex items-center gap-2">
        <form.AppForm>
          <form.SubmitButton
            label={submitLabel}
            pendingLabel={pendingLabel}
          />
        </form.AppForm>
        {actions}
      </div>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </form>
  );
}
