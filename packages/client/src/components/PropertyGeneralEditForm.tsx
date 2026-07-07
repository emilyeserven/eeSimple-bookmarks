import type { CustomProperty, UpdateCustomPropertyInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TYPE_OPTIONS, propertySchema, valuesFromProperty } from "./propertyFormParts";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

const LABELS: Partial<Record<keyof UpdateCustomPropertyInput, string>> = {
  name: "Name",
  description: "Description",
  enabled: "Status",
};

interface PropertyGeneralEditFormProps {
  property: CustomProperty;
}

/**
 * The General edit tab: name, status, and description. Each field auto-saves (no Save button) — name
 * and description on blur, the active checkbox on change. Type is immutable in edit so it renders
 * disabled and is never saved. Renaming changes the slug, so a successful name save follows it.
 */
export function PropertyGeneralEditForm({
  property,
}: PropertyGeneralEditFormProps) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();
  const typeOptions = TYPE_OPTIONS.map(option => ({
    ...option,
    label: tLabel(option.label),
  }));
  const navigate = useNavigate();
  const updateProperty = useUpdateCustomProperty();
  const isBuiltIn = property.builtIn;
  const autoSave = useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    labels: LABELS,
    initial: {
      name: property.name,
      description: property.description ?? null,
      enabled: property.enabled,
    },
  });

  const form = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });

  return (
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
              label={t("Name")}
              placeholder={t("e.g. Priority")}
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== property.slug) {
                      void navigate({
                        to: "/custom-properties/$propertySlug/edit",
                        params: {
                          propertySlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              )}
            />
          )}
        </form.AppField>

        <form.AppField name="type">
          {field => (
            <field.SelectField
              label={t("Type")}
              options={typeOptions}
              disabled
            />
          )}
        </form.AppField>
      </div>

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
                  autoSave.saveField("enabled", next);
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

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            placeholder={t("Optional — shown as a hint where this property appears.")}
            rows={2}
            onBlur={() => autoSave.saveField(
              "description",
              field.state.value.trim() || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>
    </div>
  );
}
