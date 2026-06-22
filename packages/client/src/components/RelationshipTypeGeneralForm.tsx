import type { RelationshipType, UpdateRelationshipTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateRelationshipType } from "../hooks/useRelationshipTypes";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";

const relationshipTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  directional: z.boolean(),
});

const LABELS: Partial<Record<keyof UpdateRelationshipTypeInput, string>> = {
  name: "Name",
  directional: "Direction",
};

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
  const navigate = useNavigate();
  const update = useUpdateRelationshipType();
  const autoSave = useFieldAutoSave<UpdateRelationshipTypeInput, RelationshipType>({
    id: relationshipType.id,
    update,
    labels: LABELS,
    initial: {
      name: relationshipType.name,
      directional: relationshipType.directional,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: relationshipType.name,
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
            label="Name"
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
                      to: "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
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
        ? <p className="text-xs text-muted-foreground">Built-in types can&apos;t be renamed.</p>
        : null}

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
              aria-label="Directional"
            />
            Directional (reads parent → child rather than symmetric)
          </label>
        )}
      </form.AppField>
    </div>
  );
}
