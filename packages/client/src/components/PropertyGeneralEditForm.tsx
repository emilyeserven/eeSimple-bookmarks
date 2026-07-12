import type { CustomProperty } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { usePropertyGeneralForm } from "./usePropertyGeneralForm";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  property: CustomProperty;
}

/**
 * The placeable sub-fields of a custom property's General edit form (the property workbench registry
 * uses each as a `WorkbenchField.edit` renderer; `PropertyGeneralEditForm` recomposes them into the
 * same whole form its Storybook story + `PropertyEditForm.test.tsx` render). Each owns its own
 * `usePropertyGeneralForm` slice — auto-save is per field, react-query dedupes the shared mutation.
 * Type is immutable in edit so it renders disabled and never saves.
 */

/** Name field — auto-saves on blur and follows the new slug on rename. */
export function PropertyNameField({
  property,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveName,
  } = usePropertyGeneralForm(property);
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          placeholder={t("e.g. Priority")}
          onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
        />
      )}
    </form.AppField>
  );
}

/** Type field — immutable in edit, so it renders disabled and is never saved. */
export function PropertyTypeField({
  property,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, typeOptions,
  } = usePropertyGeneralForm(property);
  return (
    <form.AppField name="type">
      {field => (
        <field.SelectField
          label={t("Type")}
          options={typeOptions}
          disabled
        />
      )}
    </form.AppField>
  );
}

/** Status (active) field — auto-saves on change. Locked for built-in properties. */
export function PropertyStatusField({
  property,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, isBuiltIn, saveEnabled,
  } = usePropertyGeneralForm(property);
  return (
    <form.AppField name="enabled">
      {field => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`property-${property.id}-enabled`}
              checked={field.state.value}
              disabled={isBuiltIn}
              onCheckedChange={(checked) => {
                const next = checked === true;
                field.handleChange(next);
                saveEnabled(next);
              }}
            />
            <Label htmlFor={`property-${property.id}-enabled`}>{t("Property is active")}</Label>
          </div>
          {isBuiltIn
            ? <p className="text-xs text-muted-foreground">{t("Built-in properties can't be disabled.")}</p>
            : null}
        </div>
      )}
    </form.AppField>
  );
}

/** Description field — auto-saves on blur. */
export function PropertyDescriptionField({
  property,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveDescription,
  } = usePropertyGeneralForm(property);
  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          debounceSave
          placeholder={t("Optional — shown as a hint where this property appears.")}
          rows={2}
          onBlur={() => saveDescription(field.state.value, field.state.meta.errors.length === 0)}
        />
      )}
    </form.AppField>
  );
}

/**
 * The General edit tab: name, status, and description. Each field auto-saves (no Save button) — name
 * and description on blur, the active checkbox on change. Type is immutable in edit so it renders
 * disabled. Composed from the same placeable sub-fields the property workbench registry uses, so this
 * whole-form shell (rendered by its Storybook story) stays in lockstep with the layout-driven General
 * tab (Name + Type keep their two-column grid here; the layout seam stacks them per field).
 */
export function PropertyGeneralEditForm({
  property,
}: Props) {
  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <PropertyNameField property={property} />
        <PropertyTypeField property={property} />
      </div>
      <PropertyStatusField property={property} />
      <PropertyDescriptionField property={property} />
    </div>
  );
}
