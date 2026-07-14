import type { RelationshipType, UpdateRelationshipTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateRelationshipType } from "../hooks/useRelationshipTypes";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const directionalSchema = z.object({
  directional: z.boolean(),
});

const NAME_LABELS: Partial<Record<keyof UpdateRelationshipTypeInput, string>> = {
  name: "Name",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateRelationshipTypeInput, string>> = {
  description: "Description",
};

const DIRECTIONAL_LABELS: Partial<Record<keyof UpdateRelationshipTypeInput, string>> = {
  directional: "Direction",
};

interface RelationshipTypeFieldProps {
  relationshipType: RelationshipType;
}

/**
 * The relationship type's name. A standalone placeable field (the `name` field in the registry); it
 * mounts its own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — the Category #1186
 * precedent). Auto-saves on blur and follows the new slug. Built-in types can't be renamed.
 */
export function RelationshipTypeNameEditField({
  relationshipType,
}: RelationshipTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const update = useUpdateRelationshipType();
  const autoSave = useFieldAutoSave<UpdateRelationshipTypeInput, RelationshipType>({
    id: relationshipType.id,
    update,
    labels: NAME_LABELS,
    initial: {
      name: relationshipType.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: relationshipType.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
    <div className="space-y-1">
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
    </div>
  );
}

/** The relationship type's description. A standalone placeable field; saves on blur. */
export function RelationshipTypeDescriptionEditField({
  relationshipType,
}: RelationshipTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateRelationshipType();
  const autoSave = useFieldAutoSave<UpdateRelationshipTypeInput, RelationshipType>({
    id: relationshipType.id,
    update,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: relationshipType.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: relationshipType.description ?? "",
    },
    validators: {
      onChange: descriptionSchema,
    },
  });

  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          debounceSave
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
  );
}

/** The relationship type's direction toggle. A standalone placeable field; saves on change. */
export function RelationshipTypeDirectionalEditField({
  relationshipType,
}: RelationshipTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateRelationshipType();
  const autoSave = useFieldAutoSave<UpdateRelationshipTypeInput, RelationshipType>({
    id: relationshipType.id,
    update,
    labels: DIRECTIONAL_LABELS,
    initial: {
      directional: relationshipType.directional,
    },
  });

  const form = useAppForm({
    defaultValues: {
      directional: relationshipType.directional,
    },
    validators: {
      onChange: directionalSchema,
    },
  });

  return (
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
  );
}

interface Props {
  relationshipType: RelationshipType;
}

/**
 * Edit a relationship type's name, description, and direction. Each field auto-saves (no Save button).
 * Composed from the same placeable sub-fields the relationship type workbench registry uses, so this
 * whole-form shell (used by `RelationshipTypeGeneralForm.stories.tsx`) stays in lockstep with the
 * layout-driven General tab.
 */
export function RelationshipTypeGeneralForm({
  relationshipType,
}: Props) {
  return (
    <div className="space-y-4">
      <RelationshipTypeNameEditField relationshipType={relationshipType} />
      <RelationshipTypeDescriptionEditField relationshipType={relationshipType} />
      <RelationshipTypeDirectionalEditField relationshipType={relationshipType} />
    </div>
  );
}
