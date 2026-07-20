import type { CustomProperty, UpdateCustomPropertyInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { TYPE_OPTIONS, propertySchema, valuesFromProperty } from "./propertyFormParts";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

const LABELS: Partial<Record<keyof UpdateCustomPropertyInput, string>> = {
  name: "Name",
  description: "Description",
  aiInstructions: "AI instructions",
  enabled: "Status",
};

/**
 * Owns the stateful pieces of the custom-property General (edit) form: the shared `useAppForm` (field
 * state/validation), the autosave engine, the translated Type options, and the field-save handlers.
 * Each placeable General sub-field (`PropertyNameField`/`PropertyTypeField`/`PropertyStatusField`/
 * `PropertyDescriptionField`) calls this hook independently — there is no cross-field coordination
 * (name→slug follow is self-contained), so react-query dedupes the shared mutation across fibers (the
 * newsletter #1187 precedent, not the bookmark form-context provider). Returns one bag so the
 * sub-fields and the recomposed `PropertyGeneralEditForm` stay presentational.
 */
export function usePropertyGeneralForm(property: CustomProperty) {
  const tLabel = useTranslatedLabel();
  const typeOptions = TYPE_OPTIONS.map(option => ({
    ...option,
    label: tLabel(option.label),
  }));
  const navigate = useNavigate();
  const updateProperty = useUpdateCustomProperty();
  const autoSave = useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    labels: LABELS,
    initial: {
      name: property.name,
      description: property.description ?? null,
      aiInstructions: property.aiInstructions ?? null,
      enabled: property.enabled,
    },
  });

  const form = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
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
    });
  }

  function saveDescription(value: string, valid: boolean): void {
    autoSave.saveField("description", value.trim() || null, {
      valid,
    });
  }

  function saveAiInstructions(value: string, valid: boolean): void {
    autoSave.saveField("aiInstructions", value.trim() || null, {
      valid,
    });
  }

  return {
    form,
    typeOptions,
    isBuiltIn: property.builtIn,
    saveName,
    saveDescription,
    saveAiInstructions,
    saveEnabled: (next: boolean) => autoSave.saveField("enabled", next),
  };
}
