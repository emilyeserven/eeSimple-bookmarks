import type { RelationshipType, UpdateRelationshipTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateRelationshipType } from "../hooks/useRelationshipTypes";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";

const relationshipTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  directional: z.boolean(),
});

interface Props {
  relationshipType: RelationshipType;
}

/**
 * Edit a relationship type's name and direction. Each field auto-saves (no Save button): the name
 * persists on blur, the directional toggle on change. Built-in types can't be renamed.
 */
export function RelationshipTypeGeneralForm({
  relationshipType,
}: Props) {
  const {
    t,
  } = useTranslation();
  const LABELS: Partial<Record<keyof UpdateRelationshipTypeInput, string>> = {
    name: t("Name"),
    description: t("Description"),
    directional: t("Direction"),
  };
  const navigate = useNavigate();
  const update = useUpdateRelationshipType();
  const autoSave = useFieldAutoSave<UpdateRelationshipTypeInput, RelationshipType>({
    id: relationshipType.id,
    update,
    labels: LABELS,
    initial: {
      name: relationshipType.name,
      description: relationshipType.description ?? null,
      directional: relationshipType.directional,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: relationshipType.name,
      description: relationshipType.description ?? "",
      directional: relationshipType.directional,
    },
    validators: {
      onChange: relationshipTypeGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            disabled={relationshipType.builtIn}
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== relationshipType.slug) {
                    void navigate({
                      to: "/taxonomies/relationship-types/$relationshipTypeSlug/edit",
                      params: {
                        relationshipTypeSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>
      {relationshipType.builtIn
        ? <p className="text-xs text-muted-foreground">{t("Built-in types can't be renamed.")}</p>
        : null}

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
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

      <form.AppField name="directional">
        {field => (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={field.state.value}
              onCheckedChange={(checked) => {
                const next = checked === true;
                field.handleChange(next);
                autoSave.saveField("directional", next);
              }}
              aria-label={t("Directional")}
            />
            {t("Directional (reads parent → child rather than symmetric)")}
          </label>
        )}
      </form.AppField>
    </div>
  );
}
